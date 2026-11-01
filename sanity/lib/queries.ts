import type { Parser } from "groqd";
import type { AllSanitySchemaTypes, SanityImageAssetReference, SanityImageCrop, SanityImageHotspot, SiteSettings } from "@/sanity.types";
import { imageAsset, imageCrop, imageDimensions, imageHotspot, portableText, q, z } from "./groqd";

// Every content query takes `$lang` and `$fallbackLang` (the default locale). A document that
// hasn't been translated yet falls back to its default-language counterpart instead of vanishing.
// New queries (projects, talent, ...) should follow the same pattern.
//
// Queries are built with groqd (see `./groqd`): every projected field has a validator, and the response
// is parsed against it where the query is run (`fetchQuery` in `./live`). Where the builder has no
// method (merging two lists, `^.` parent references), `raw` takes a GROQ expression plus its validator.

type Lang = { lang: string; fallbackLang: string };
const base = q.parameters<Lang>();
/** A query root that declares its parameters (`$lang`, `$fallbackLang`, plus whatever the query adds). */
type Root<P extends object> = ReturnType<typeof q.parameters<P>>;

type DocumentOf<T extends string> = Extract<AllSanitySchemaTypes, { _type: T }>;
type Translatable = "rentalItem" | "rentalCategory" | "talent" | "project" | "projectType" | "role" | "siteSettings";

/** The default-language document a translation was made from (they share a slug). Use inside a projection. */
const DEFAULT_COUNTERPART = `*[_type == ^._type && language == $fallbackLang && slug.current == ^.slug.current][0]`;

/**
 * Rental items the default-language document has marked unavailable are hidden in every language:
 * availability and stock are read-only in translations (see readOnlyInTranslation), so they can't be trusted there.
 */
const RENTAL_AVAILABLE = ` && !(slug.current in *[_type == "rentalItem" && language == $fallbackLang && available == false].slug.current)`;

/**
 * Documents of `type` in `$lang`, plus default-language ones with no translation (matched by slug),
 * ordered by the editor-set drag-and-drop rank. Every language shares the default language's order
 * (matched by slug); a document with no default-language counterpart uses its own rank. Unranked
 * documents tie, so `tiebreak` (a field name) keeps their order stable. `extra` adds filter terms.
 */
const ranked = <P extends Lang, T extends Translatable>(root: Root<P>, type: T, tiebreak: string, extra = "") =>
  root
    .raw<Array<DocumentOf<T>>>(
      `(
    *[_type == "${type}" && language == $lang${extra}]
    + *[_type == "${type}" && language == $fallbackLang${extra} && !(slug.current in *[_type == "${type}" && language == $lang${extra}].slug.current)]
  )`,
    )
    .raw(
      `[]{
    ...,
    "rank": coalesce(${DEFAULT_COUNTERPART}.orderRank, orderRank)
  } | order(rank asc, ${tiebreak} asc)`,
      "passthrough",
    );

/** Available rental items in `$lang`, plus default-language ones with no translation. */
const rentalItems = (root: Root<Lang>) => ranked(root, "rentalItem", "name", RENTAL_AVAILABLE);

/** The title of a role or project type in `$lang`; those references always point at the default-language document. */
const translatedTitle = (type: "role" | "projectType") =>
  `coalesce(*[_type == "${type}" && language == $lang && slug.current == ^.slug.current][0].title, title)`;

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

type ImageLike = { alt?: string; asset?: SanityImageAssetReference; crop?: SanityImageCrop; hotspot?: SanityImageHotspot };

/** An image without its size: enough to label it, and for `next/image` where the catalogue shows it at a fixed frame. */
const imageBasics = q.fragment<ImageLike>().project((sub) => ({
  alt: nullableString,
  asset: imageAsset,
  crop: imageCrop,
  hotspot: imageHotspot,
  lqip: sub.field("asset").deref().field("metadata.lqip", nullableString),
}));

/** What every image projection returns; `lqip` and `dimensions` come from the image asset. */
const imageFields = q.fragment<ImageLike>().project((sub) => ({
  ...imageBasics,
  dimensions: sub.field("asset").deref().field("metadata.dimensions", imageDimensions),
}));

/** The site settings in one language: `[0]` of the (at most one) document. */
const siteSettings = (lang: "$lang" | "$fallbackLang", extra = "") =>
  base.star.filterByType("siteSettings").filterRaw(`language == ${lang}${extra}`).slice(0);

export const HOME_STILLS_QUERY = base
  .coalesce(siteSettings("$lang", " && count(homeStills[defined(asset)]) > 0"), siteSettings("$fallbackLang"))
  .project((settings) => ({
    _id: z.string(),
    stills: settings
      .field("homeStills[]")
      .filterRaw("defined(asset)")
      .project({
        _key: z.string(),
        lightTint: nullableString,
        ...imageFields,
      })
      .nullable(true),
  }))
  .nullable(true);

const rentalItemFields = q.fragmentForType<"rentalItem">().project((sub) => ({
  _id: z.string(),
  name: z.string(),
  slug: z.slug("slug"),
  brand: nullableString,
  summary: nullableString,
  keyFeatures: z.array(z.string()).nullable(),
  maxQuantity: sub.raw(`coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)`, nullableNumber),
  category: sub
    .field("category")
    .deref()
    .project({
      _id: z.string(),
      title: z.string(),
      slug: z.slug("slug"),
    })
    .nullable(),
  images: sub
    .field("images[]")
    .filterRaw("defined(asset)")
    .project({
      _key: z.string(),
      ...imageFields,
    })
    .nullable(true),
}));

export const RENTALS_QUERY = base.project({
  categories: ranked(base, "rentalCategory", "title").project({
    _id: z.string(),
    title: z.string(),
    slug: z.slug("slug"),
  }),
  items: rentalItems(base).project(rentalItemFields),
});

export const RENTAL_ITEM_QUERY = q
  .parameters<Lang & { slug: string }>()
  .coalesce(
    q.star.filterByType("rentalItem").filterRaw(`language == $lang && slug.current == $slug${RENTAL_AVAILABLE}`).slice(0),
    q.star.filterByType("rentalItem").filterRaw(`language == $fallbackLang && slug.current == $slug${RENTAL_AVAILABLE}`).slice(0),
  )
  .project((sub) => ({
    ...rentalItemFields,
    specs: sub.field("specs[]").project({ _key: z.string(), key: z.string(), value: z.string() }).nullable(true),
    includedInKit: z.array(z.string()).nullable(),
  }))
  .nullable(true);

/** Just enough per item to label basket lines, which only store ids and quantities. */
export const QUOTE_CATALOGUE_QUERY = rentalItems(base).project((sub) => ({
  _id: z.string(),
  name: z.string(),
  brand: nullableString,
  maxQuantity: sub.raw(`coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)`, nullableNumber),
  slug: z.slug("slug"),
  image: sub.field("images[]").filterRaw("defined(asset)").slice(0).project(imageBasics),
}));

/**
 * Settings fields read from the `$lang` document first, then from the default language's. The two
 * documents are fetched once as `cur` and `fb` (with the listed fields), and `both` picks each field.
 */
type SettingsField = Exclude<keyof SiteSettings, "_type" | "_createdAt" | "_updatedAt" | "_rev" | "language">;
const settingsPair = (fields: readonly SettingsField[]) =>
  base.raw<{ cur: unknown; fb: unknown }>(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{ ${fields.join(", ")} },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{ ${fields.join(", ")} }
}`);
const both = <T>(sub: { raw: typeof base.raw }, field: SettingsField, parser: Parser<unknown, T>) =>
  sub.raw<T>(`coalesce(cur.${field}, fb.${field})`, parser);

const CONTACT_FIELDS = ["contactEmail", "instagram"] as const;
export const CONTACT_SETTINGS_QUERY = settingsPair(CONTACT_FIELDS).project((sub) => ({
  contactEmail: both(sub, "contactEmail", nullableString),
  instagram: both(sub, "instagram", nullableString),
}));

/** Recipient addresses for form notifications, falling back to the default language's settings. */
export const SUBMISSION_SETTINGS_QUERY = base
  .coalesce(siteSettings("$lang"), siteSettings("$fallbackLang"))
  .project({ contactEmail: nullableString, quoteRecipient: nullableString })
  .nullable(true);

/** Ids of rental items that can currently be requested (published and available). */
export const AVAILABLE_ITEM_IDS_QUERY = q
  .parameters<{ ids: string[]; fallbackLang: string }>()
  .star.filterByType("rentalItem")
  .filterRaw(`_id in $ids${RENTAL_AVAILABLE}`)
  .project((sub) => ({
    _id: z.string(),
    name: z.string(),
    brand: nullableString,
    maxQuantity: sub.raw(`coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)`, nullableNumber),
  }));

const PAGE_TEXT_FIELDS = [
  "rentalsIntro",
  "quoteIntro",
  "contactIntro",
  "workIntro",
  "talentIntro",
  "aboutTagline",
  "workTagline",
  "talentTagline",
  "rentalsTagline",
  "contactTagline",
] as const;

/** Editor-written intro lines for the Rentals, Request a quote, Contact, Our Work and Talent pages, plus each page's Fiú line. */
export const PAGE_TEXT_QUERY = settingsPair(PAGE_TEXT_FIELDS).project((sub) => ({
  rentalsIntro: both(sub, "rentalsIntro", nullableString),
  quoteIntro: both(sub, "quoteIntro", nullableString),
  contactIntro: both(sub, "contactIntro", nullableString),
  workIntro: both(sub, "workIntro", nullableString),
  talentIntro: both(sub, "talentIntro", nullableString),
  aboutTagline: both(sub, "aboutTagline", nullableString),
  workTagline: both(sub, "workTagline", nullableString),
  talentTagline: both(sub, "talentTagline", nullableString),
  rentalsTagline: both(sub, "rentalsTagline", nullableString),
  contactTagline: both(sub, "contactTagline", nullableString),
}));

/** An image field, or the default-language document's when this translation has none (a `select` over `^.`-style lookups). */
const imageOrCounterpart = (field: "portrait" | "coverStill") =>
  q.raw<ImageLike>(
    `select(defined(${field}.asset) => ${field}, ${DEFAULT_COUNTERPART}.${field})`,
  );

const talentCardFields = q.fragmentForType<"talent">().project((sub) => ({
  _id: z.string(),
  name: z.string(),
  slug: z.slug("slug"),
  roles: sub.raw(`roles[]->{ "title": ${translatedTitle("role")} }.title`, z.array(z.string()).nullable()),
  portrait: imageOrCounterpart("portrait").project(imageFields),
}));

/** The Talent index: the roster in the editors' drag-and-drop order. */
export const TALENT_QUERY = ranked(base, "talent", "name").project(talentCardFields);

/** One person for their bio page. `talentId` is the default-language document that projects credit. */
export const TALENT_PROFILE_QUERY = q
  .parameters<Lang & { slug: string }>()
  .coalesce(
    q.star.filterByType("talent").filterRaw("language == $lang && slug.current == $slug").slice(0),
    q.star.filterByType("talent").filterRaw("language == $fallbackLang && slug.current == $slug").slice(0),
  )
  .project((sub) => ({
    ...talentCardFields,
    bio: sub.raw(`coalesce(bio, ${DEFAULT_COUNTERPART}.bio)`, portableText),
    talentId: sub.raw(`coalesce(${DEFAULT_COUNTERPART}._id, _id)`, z.string()),
  }))
  .nullable(true);

/** What a project slide needs: shared by the Our Work scroll and a talent's own scroll. */
const projectSlideFields = q.fragmentForType<"project">().project((sub) => ({
  _id: z.string(),
  title: z.string(),
  slug: z.slug("slug"),
  typeSlug: sub.raw("type->slug.current", nullableString),
  type: sub.raw(`type->{ "title": ${translatedTitle("projectType")} }.title`, nullableString),
  year: sub.raw(`coalesce(year, ${DEFAULT_COUNTERPART}.year)`, nullableNumber),
  client: sub.raw(`coalesce(client, ${DEFAULT_COUNTERPART}.client)`, nullableString),
  vimeoUrl: sub.raw(`coalesce(vimeoUrl, ${DEFAULT_COUNTERPART}.vimeoUrl)`, nullableString),
  previewLoopUrl: sub.raw(`coalesce(previewLoopUrl, ${DEFAULT_COUNTERPART}.previewLoopUrl)`, nullableString),
  cover: imageOrCounterpart("coverStill").project(imageFields),
}));

/** The projects a person is credited on, in the editors' drag-and-drop order, with what they did on each. */
export const TALENT_PROJECTS_QUERY = ranked(q.parameters<Lang & { talentId: string }>(), "project", "title", " && references($talentId)").project((sub) => ({
  ...projectSlideFields,
  roles: sub.raw(`credits[talent._ref == $talentId].role->{ "title": ${translatedTitle("role")} }.title`, z.array(z.string()).nullable()),
}));

/** Our Work: every project in the editors' drag-and-drop order, and the types that filter them. */
export const WORK_QUERY = base.project({
  types: ranked(base, "projectType", "title").project((sub) => ({
    slug: z.slug("slug"),
    title: sub.raw("coalesce(pluralTitle, title)", z.string()),
  })),
  projects: ranked(base, "project", "title").project(projectSlideFields),
});

/** The About page: slogan, gloss, manifesto and still from Site settings, each falling back to the default language's. */
export const ABOUT_QUERY = settingsPair(["_id", "slogan", "sloganGloss", "manifesto", "contactEmail", "instagram", "aboutStill"]).project((sub) => ({
  _id: both(sub, "_id", nullableString),
  slogan: both(sub, "slogan", nullableString),
  sloganGloss: both(sub, "sloganGloss", nullableString),
  manifesto: both(sub, "manifesto", portableText),
  contactEmail: both(sub, "contactEmail", nullableString),
  instagram: both(sub, "instagram", nullableString),
  still: sub
    .raw<ImageLike>(
      "select(defined(cur.aboutStill.asset) => cur.aboutStill, fb.aboutStill)",
    )
    .project(imageFields),
}));
