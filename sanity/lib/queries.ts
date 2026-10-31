import { defineQuery } from "next-sanity";

// Every content query takes `$lang` and `$fallbackLang` (the default locale). A document that
// hasn't been translated yet falls back to its default-language counterpart instead of vanishing.
// New queries (projects, talent, ...) should follow the same pattern.

/** Documents of `type` in `$lang`, plus default-language ones with no translation (matched by slug). */
const withFallback = (type: string, extra = "") => `(
    *[_type == "${type}" && language == $lang${extra}]
    + *[_type == "${type}" && language == $fallbackLang${extra} && !(slug.current in *[_type == "${type}" && language == $lang${extra}].slug.current)]
  )`;

/** The default-language document a translation was made from (they share a slug). Use inside a projection. */
const DEFAULT_COUNTERPART = `*[_type == ^._type && language == $fallbackLang && slug.current == ^.slug.current][0]`;

/**
 * Rental items the default-language document has marked unavailable are hidden in every language:
 * availability and stock are read-only in translations (see readOnlyInTranslation), so they can't be trusted there.
 */
const RENTAL_AVAILABLE = ` && !(slug.current in *[_type == "rentalItem" && language == $fallbackLang && available == false].slug.current)`;

/**
 * Orders a document list by the editor-set drag-and-drop rank. Every language shares the default
 * language's order (matched by slug); a document with no default-language counterpart uses its own
 * rank. Unranked documents tie, so `tiebreak` (a field name) keeps their order stable.
 */
const byRank = (tiebreak: string) => `[]{
    ...,
    "rank": coalesce(${DEFAULT_COUNTERPART}.orderRank, orderRank)
  } | order(rank asc, ${tiebreak} asc)`;

export const HOME_STILLS_QUERY = defineQuery(`
  coalesce(
    *[_type == "siteSettings" && language == $lang && count(homeStills[defined(asset)]) > 0][0],
    *[_type == "siteSettings" && language == $fallbackLang][0]
  ){
    _id,
    "stills": homeStills[defined(asset)]{
      _key,
      alt,
      lightTint,
      asset,
      crop,
      hotspot,
      "lqip": asset->metadata.lqip,
      "dimensions": asset->metadata.dimensions
    }
  }
`);

const RENTAL_ITEM_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  brand,
  summary,
  keyFeatures,
  "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity),
  "category": category->{ _id, title, "slug": slug.current },
  "images": images[defined(asset)]{
    _key,
    alt,
    asset,
    crop,
    hotspot,
    "lqip": asset->metadata.lqip,
    "dimensions": asset->metadata.dimensions
  }
`;

export const RENTALS_QUERY = defineQuery(`{
  "categories": ${withFallback("rentalCategory")}${byRank("title")}{
    _id,
    title,
    "slug": slug.current
  },
  "items": ${withFallback("rentalItem", RENTAL_AVAILABLE)}${byRank("name")}{
    ${RENTAL_ITEM_FIELDS}
  }
}`);

export const RENTAL_ITEM_QUERY = defineQuery(`
  coalesce(
    *[_type == "rentalItem" && language == $lang && slug.current == $slug${RENTAL_AVAILABLE}][0],
    *[_type == "rentalItem" && language == $fallbackLang && slug.current == $slug${RENTAL_AVAILABLE}][0]
  ){
    ${RENTAL_ITEM_FIELDS},
    specs[]{ _key, key, value },
    includedInKit
  }
`);

/** Just enough per item to label basket lines, which only store ids and quantities. */
export const QUOTE_CATALOGUE_QUERY = defineQuery(`
  ${withFallback("rentalItem", RENTAL_AVAILABLE)}${byRank("name")}{
    _id,
    name,
    brand,
    "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity),
    "slug": slug.current,
    "image": images[defined(asset)][0]{ alt, asset, crop, hotspot, "lqip": asset->metadata.lqip }
  }
`);

export const CONTACT_SETTINGS_QUERY = defineQuery(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{ contactEmail, instagram },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{ contactEmail, instagram }
}{
  "contactEmail": coalesce(cur.contactEmail, fb.contactEmail),
  "instagram": coalesce(cur.instagram, fb.instagram)
}`);

/** Recipient addresses for form notifications, falling back to the default language's settings. */
export const SUBMISSION_SETTINGS_QUERY = defineQuery(`
  coalesce(
    *[_type == "siteSettings" && language == $lang][0],
    *[_type == "siteSettings" && language == $fallbackLang][0]
  ){ contactEmail, quoteRecipient }
`);

/** Ids of rental items that can currently be requested (published and available). */
export const AVAILABLE_ITEM_IDS_QUERY = defineQuery(`
  *[_type == "rentalItem" && _id in $ids${RENTAL_AVAILABLE}]{
    _id, name, brand,
    "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)
  }
`);

/** Editor-written intro lines for the Rentals, Request a quote, Contact, Our Work and Talent pages. */
export const PAGE_TEXT_QUERY = defineQuery(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{ rentalsIntro, quoteIntro, contactIntro, workIntro, talentIntro },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{ rentalsIntro, quoteIntro, contactIntro, workIntro, talentIntro }
}{
  "rentalsIntro": coalesce(cur.rentalsIntro, fb.rentalsIntro),
  "quoteIntro": coalesce(cur.quoteIntro, fb.quoteIntro),
  "contactIntro": coalesce(cur.contactIntro, fb.contactIntro),
  "workIntro": coalesce(cur.workIntro, fb.workIntro),
  "talentIntro": coalesce(cur.talentIntro, fb.talentIntro)
}`);

/** The title of a role or project type in `$lang`; those references always point at the default-language document. */
const translatedTitle = (type: string) =>
  `coalesce(*[_type == "${type}" && language == $lang && slug.current == ^.slug.current][0].title, title)`;

const IMAGE_FIELDS = `alt, asset, crop, hotspot, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

const TALENT_CARD_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  "roles": roles[]->{ "title": ${translatedTitle("role")} }.title,
  "portrait": select(defined(portrait.asset) => portrait, ${DEFAULT_COUNTERPART}.portrait){ ${IMAGE_FIELDS} }
`;

/** The Talent index: the roster in the editors' drag-and-drop order. */
export const TALENT_QUERY = defineQuery(`
  ${withFallback("talent")}${byRank("name")}{
    ${TALENT_CARD_FIELDS}
  }
`);

/** One person for their bio page. `talentId` is the default-language document that projects credit. */
export const TALENT_PROFILE_QUERY = defineQuery(`
  coalesce(
    *[_type == "talent" && language == $lang && slug.current == $slug][0],
    *[_type == "talent" && language == $fallbackLang && slug.current == $slug][0]
  ){
    ${TALENT_CARD_FIELDS},
    "bio": coalesce(bio, ${DEFAULT_COUNTERPART}.bio),
    "talentId": coalesce(${DEFAULT_COUNTERPART}._id, _id)
  }
`);

/** What a project slide needs: shared by the Our Work scroll and a talent's own scroll. */
const PROJECT_SLIDE_FIELDS = `
    _id,
    title,
    "slug": slug.current,
    "typeSlug": type->slug.current,
    "type": type->{ "title": ${translatedTitle("projectType")} }.title,
    "year": coalesce(year, ${DEFAULT_COUNTERPART}.year),
    "client": coalesce(client, ${DEFAULT_COUNTERPART}.client),
    "vimeoUrl": coalesce(vimeoUrl, ${DEFAULT_COUNTERPART}.vimeoUrl),
    "previewLoopUrl": coalesce(previewLoopUrl, ${DEFAULT_COUNTERPART}.previewLoopUrl),
    "cover": select(defined(coverStill.asset) => coverStill, ${DEFAULT_COUNTERPART}.coverStill){ ${IMAGE_FIELDS} }
`;

/** The projects a person is credited on, in the editors' drag-and-drop order, with what they did on each. */
export const TALENT_PROJECTS_QUERY = defineQuery(`
  ${withFallback("project", " && references($talentId)")}${byRank("title")}{
    ${PROJECT_SLIDE_FIELDS},
    "roles": credits[talent._ref == $talentId].role->{ "title": ${translatedTitle("role")} }.title
  }
`);

/** Our Work: every project in the editors' drag-and-drop order, and the types that filter them. */
export const WORK_QUERY = defineQuery(`{
  "types": ${withFallback("projectType")}${byRank("title")}{
    "slug": slug.current,
    "title": coalesce(pluralTitle, title)
  },
  "projects": ${withFallback("project")}${byRank("title")}{
    ${PROJECT_SLIDE_FIELDS}
  }
}`);

/** The About page: slogan, gloss, manifesto and still from Site settings, each falling back to the default language's. */
export const ABOUT_QUERY = defineQuery(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{
    _id, slogan, sloganGloss, manifesto, contactEmail, instagram,
    "still": aboutStill{ ${IMAGE_FIELDS} }
  },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{
    _id, slogan, sloganGloss, manifesto, contactEmail, instagram,
    "still": aboutStill{ ${IMAGE_FIELDS} }
  }
}{
  "_id": coalesce(cur._id, fb._id),
  "slogan": coalesce(cur.slogan, fb.slogan),
  "sloganGloss": coalesce(cur.sloganGloss, fb.sloganGloss),
  "manifesto": coalesce(cur.manifesto, fb.manifesto),
  "contactEmail": coalesce(cur.contactEmail, fb.contactEmail),
  "instagram": coalesce(cur.instagram, fb.instagram),
  "still": select(defined(cur.still.asset) => cur.still, fb.still)
}`);
