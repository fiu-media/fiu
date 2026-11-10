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
export const RENTAL_AVAILABLE =
  ` && !(slug.current in *[_type == "rentalItem" && language == $fallbackLang && available == false].slug.current)` as const;

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

/**
 * Available rental items in `$lang`, plus default-language ones with no translation. This is `withFallback("rentalItem",
 * RENTAL_AVAILABLE)` written out: TypeGen can't follow a constant passed as `withFallback`'s `extra` ("Could not find
 * binding for node extra"), only a literal.
 */
export const RENTAL_ITEMS = `(
    *[_type == "rentalItem" && language == $lang${RENTAL_AVAILABLE}]
    + *[_type == "rentalItem" && language == $fallbackLang${RENTAL_AVAILABLE} && !(slug.current in *[_type == "rentalItem" && language == $lang${RENTAL_AVAILABLE}].slug.current)]
  )` as const;

/** An array field, or the default-language document's when the translation left it empty. */
export const arrayOrDefault = <const F extends string>(field: F) =>
  `select(count(${field}) > 0 => ${field}, ${DEFAULT_COUNTERPART}.${field})` as const;

/** The title of a role or project type in `$lang`; those references always point at the default-language document. */
export const translatedTitle = <const T extends string>(type: T) =>
  `coalesce(*[_type == "${type}" && language == $lang && slug.current == ^.slug.current][0].title, title)` as const;

/**
 * What names a rental item and its cap, shared by every rental query. Names and brands are never translated (read-only
 * in translations), so every language shows the default-language value. `baseId` is the default-language document's
 * id, which basket lines use so they survive a language switch. `as const` keeps the literal type for TypeGen.
 */
export const RENTAL_ITEM_IDENTITY = `
  _id,
  "baseId": coalesce(${DEFAULT_COUNTERPART}._id, _id),
  "name": coalesce(${DEFAULT_COUNTERPART}.name, name),
  "brand": coalesce(${DEFAULT_COUNTERPART}.brand, brand),
  "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)
` as const;

/**
 * A rental item's identity plus the rest, which falls back field by field so a half-translated item still renders in
 * full. `as const` keeps the literal type, which TypeGen needs to resolve the queries that embed this.
 */
export const RENTAL_ITEM_FIELDS = `
  ${RENTAL_ITEM_IDENTITY},
  "slug": slug.current,
  "summary": coalesce(summary, ${DEFAULT_COUNTERPART}.summary),
  "keyFeatures": ${arrayOrDefault("keyFeatures")},
  "category": coalesce(${DEFAULT_COUNTERPART}.category, category)->{
    _id,
    "title": ${translatedTitle("rentalCategory")},
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

export const IMAGE_FIELDS = `alt, asset, crop, hotspot, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

export const TALENT_CARD_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  "roles": roles[]->{ "title": ${translatedTitle("role")} }.title,
  "portrait": select(defined(portrait.asset) => portrait, ${DEFAULT_COUNTERPART}.portrait){ ${IMAGE_FIELDS} }
` as const;

/**
 * An image that has a portrait (mobile) variant, as `{ landscape, portrait }`. Each falls back to the default-language
 * document's when the translation has none. Literal arguments so TypeGen can evaluate the query.
 */
const responsiveImage = <const F extends string, const M extends string>(field: F, mobileField: M) =>
  `{
    "landscape": select(defined(${field}.asset) => ${field}, ${DEFAULT_COUNTERPART}.${field}){ ${IMAGE_FIELDS} },
    "portrait": select(defined(${mobileField}.asset) => ${mobileField}, ${DEFAULT_COUNTERPART}.${mobileField}){ ${IMAGE_FIELDS} }
  }` as const;

/** Like `responsiveImage`, for two arrays of images (stills), each falling back to the default-language document's. */
export const responsiveImages = <const F extends string, const M extends string>(field: F, mobileField: M) =>
  `{
    "landscape": coalesce(${field}, ${DEFAULT_COUNTERPART}.${field})[defined(asset)]{ _key, ${IMAGE_FIELDS} },
    "portrait": coalesce(${mobileField}, ${DEFAULT_COUNTERPART}.${mobileField})[defined(asset)]{ _key, ${IMAGE_FIELDS} }
  }` as const;

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
    "cover": ${responsiveImage("coverStill", "coverStillMobile")}
` as const;
