// Every content query takes `$lang` and `$fallbackLang` (the default locale). A document that
// hasn't been translated yet falls back to its default-language counterpart instead of vanishing.
// New queries (projects, talent, ...) should follow the same pattern.

/**
 * Documents of `type` in `$lang`, plus default-language ones with no translation (matched by slug).
 * `extra` adds filter terms (pass `""` for none). The helpers in this file are generic and use literal
 * arguments so TypeGen can evaluate each query and TypeScript keeps its exact string type.
 */
export const withFallback = <const T extends string, const E extends string>(type: T, extra: E) =>
  `(
    *[_type == "${type}" && language == $lang${extra}]
    + *[_type == "${type}" && language == $fallbackLang${extra} && !(slug.current in *[_type == "${type}" && language == $lang${extra}].slug.current)]
  )` as const;

/** The default-language document a translation was made from (they share a slug). Use inside a projection. */
export const DEFAULT_COUNTERPART = `*[_type == ^._type && language == $fallbackLang && slug.current == ^.slug.current][0]`;

/**
 * Rental items the default-language document has marked unavailable are hidden in every language:
 * availability and stock are read-only in translations (see readOnlyInTranslation), so they can't be trusted there.
 */
export const RENTAL_AVAILABLE = ` && !(slug.current in *[_type == "rentalItem" && language == $fallbackLang && available == false].slug.current)`;

/**
 * Orders a document list by the editor-set drag-and-drop rank. Every language shares the default
 * language's order (matched by slug); a document with no default-language counterpart uses its own
 * rank. Unranked documents tie, so `tiebreak` (a field name) keeps their order stable.
 */
export const byRank = <const T extends string>(tiebreak: T) =>
  `[]{
    ...,
    "rank": coalesce(${DEFAULT_COUNTERPART}.orderRank, orderRank)
  } | order(rank asc, ${tiebreak} asc)` as const;

/** Available rental items in `$lang`, plus default-language ones with no translation. Written out (not `withFallback`) so TypeGen can resolve it. */
export const RENTAL_ITEMS = `(
    *[_type == "rentalItem" && language == $lang${RENTAL_AVAILABLE}]
    + *[_type == "rentalItem" && language == $fallbackLang${RENTAL_AVAILABLE} && !(slug.current in *[_type == "rentalItem" && language == $lang${RENTAL_AVAILABLE}].slug.current)]
  )`;

/** An array field, or the default-language document's when the translation left it empty. */
export const arrayOrDefault = <const F extends string>(field: F) =>
  `select(count(${field}) > 0 => ${field}, ${DEFAULT_COUNTERPART}.${field})` as const;

/**
 * Names and brands are never translated (read-only in translations), so every language shows the
 * default-language value. The rest falls back field by field, so a half-translated item still renders in full.
 * `baseId` is the default-language document's id, which basket lines use so they survive a language switch.
 * `as const` keeps the literal type, which TypeGen needs to resolve the queries that embed this.
 */
export const RENTAL_ITEM_FIELDS = `
  _id,
  "baseId": coalesce(${DEFAULT_COUNTERPART}._id, _id),
  "name": coalesce(${DEFAULT_COUNTERPART}.name, name),
  "slug": slug.current,
  "brand": coalesce(${DEFAULT_COUNTERPART}.brand, brand),
  "summary": coalesce(summary, ${DEFAULT_COUNTERPART}.summary),
  "keyFeatures": ${arrayOrDefault("keyFeatures")},
  "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity),
  "category": coalesce(${DEFAULT_COUNTERPART}.category, category)->{
    _id,
    "title": coalesce(*[_type == "rentalCategory" && language == $lang && slug.current == ^.slug.current][0].title, title),
    "slug": slug.current
  },
  "images": ${arrayOrDefault("images[defined(asset)]")}[]{
    _key,
    alt,
    asset,
    crop,
    hotspot,
    "lqip": asset->metadata.lqip,
    "dimensions": asset->metadata.dimensions
  }
` as const;

/** The title of a role or project type in `$lang`; those references always point at the default-language document. */
export const translatedTitle = <const T extends string>(type: T) =>
  `coalesce(*[_type == "${type}" && language == $lang && slug.current == ^.slug.current][0].title, title)` as const;

export const IMAGE_FIELDS = `alt, asset, crop, hotspot, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

export const TALENT_CARD_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  "roles": roles[]->{ "title": ${translatedTitle("role")} }.title,
  "portrait": select(defined(portrait.asset) => portrait, ${DEFAULT_COUNTERPART}.portrait){ ${IMAGE_FIELDS} }
` as const;

/** What a project slide needs: shared by the Our Work scroll and a talent's own scroll. */
export const PROJECT_SLIDE_FIELDS = `
    _id,
    title,
    "slug": slug.current,
    "typeSlug": type->slug.current,
    "type": type->{ "title": ${translatedTitle("projectType")} }.title,
    "year": coalesce(year, ${DEFAULT_COUNTERPART}.year),
    "client": coalesce(client, ${DEFAULT_COUNTERPART}.client),
    "vimeoUrl": coalesce(vimeoUrl, ${DEFAULT_COUNTERPART}.vimeoUrl),
    "previewLoopUrl": coalesce(previewLoopUrl, ${DEFAULT_COUNTERPART}.previewLoopUrl),
    "cover": select(defined(coverStill.asset) => coverStill, ${DEFAULT_COUNTERPART}.coverStill){ ${IMAGE_FIELDS} },
    "coverMobile": select(defined(coverStillMobile.asset) => coverStillMobile, ${DEFAULT_COUNTERPART}.coverStillMobile){ ${IMAGE_FIELDS} }
` as const;
