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

/** An array field, or the default-language document's when the translation left it empty. */
const arrayOrDefault = (field: string) => `select(count(${field}) > 0 => ${field}, ${DEFAULT_COUNTERPART}.${field})`;

/**
 * Names and brands are never translated (read-only in translations), so every language shows the
 * default-language value. The rest falls back field by field, so a half-translated item still renders in full.
 * `baseId` is the default-language document's id, which basket lines use so they survive a language switch.
 */
const RENTAL_ITEM_FIELDS = `
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
    "specs": ${arrayOrDefault("specs")}[]{ _key, key, value },
    "includedInKit": ${arrayOrDefault("includedInKit")}
  }
`);

/** Just enough per item to label basket lines, which only store ids and quantities. */
export const QUOTE_CATALOGUE_QUERY = defineQuery(`
  ${withFallback("rentalItem", RENTAL_AVAILABLE)}${byRank("name")}{
    _id,
    "baseId": coalesce(${DEFAULT_COUNTERPART}._id, _id),
    "name": coalesce(${DEFAULT_COUNTERPART}.name, name),
    "brand": coalesce(${DEFAULT_COUNTERPART}.brand, brand),
    "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity),
    "slug": slug.current,
    "image": ${arrayOrDefault("images[defined(asset)]")}[0]{ alt, asset, crop, hotspot, "lqip": asset->metadata.lqip }
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

/**
 * Rental items that can currently be requested (published and available). Basket lines hold the
 * default-language id, so only those documents match and names come out in the default language.
 */
export const AVAILABLE_ITEM_IDS_QUERY = defineQuery(`
  *[_type == "rentalItem" && language == $fallbackLang && _id in $ids${RENTAL_AVAILABLE}]{
    _id, name, brand,
    "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)
  }
`);

/** Editor-written intro lines for the Rentals, Request a quote and Contact pages. */
export const PAGE_TEXT_QUERY = defineQuery(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{ rentalsIntro, quoteIntro, contactIntro },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{ rentalsIntro, quoteIntro, contactIntro }
}{
  "rentalsIntro": coalesce(cur.rentalsIntro, fb.rentalsIntro),
  "quoteIntro": coalesce(cur.quoteIntro, fb.quoteIntro),
  "contactIntro": coalesce(cur.contactIntro, fb.contactIntro)
}`);
