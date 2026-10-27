import { defineQuery } from "next-sanity";

// Every content query takes `$lang` and `$fallbackLang` (the default locale). A document that
// hasn't been translated yet falls back to its default-language counterpart instead of vanishing.
// New queries (projects, talent, ...) should follow the same pattern.

/** Documents of `type` in `$lang`, plus default-language ones with no translation (matched by slug). */
const withFallback = (type: string, extra = "") => `(
    *[_type == "${type}" && language == $lang${extra}]
    + *[_type == "${type}" && language == $fallbackLang${extra} && !(slug.current in *[_type == "${type}" && language == $lang${extra}].slug.current)]
  )`;

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
  maxQuantity,
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
  "categories": ${withFallback("rentalCategory")} | order(order asc){
    _id,
    title,
    "slug": slug.current
  },
  "items": ${withFallback("rentalItem", " && available != false")} | order(order asc){
    ${RENTAL_ITEM_FIELDS}
  }
}`);

export const RENTAL_ITEM_QUERY = defineQuery(`
  coalesce(
    *[_type == "rentalItem" && language == $lang && slug.current == $slug && available != false][0],
    *[_type == "rentalItem" && language == $fallbackLang && slug.current == $slug && available != false][0]
  ){
    ${RENTAL_ITEM_FIELDS},
    specs[]{ _key, key, value },
    includedInKit
  }
`);

/** Just enough per item to label basket lines, which only store ids and quantities. */
export const QUOTE_CATALOGUE_QUERY = defineQuery(`
  ${withFallback("rentalItem", " && available != false")} | order(order asc){
    _id,
    name,
    brand,
    maxQuantity,
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
  *[_type == "rentalItem" && _id in $ids && available != false]{ _id, name, brand, maxQuantity }
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
