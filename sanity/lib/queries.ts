import { defineQuery } from "next-sanity";

export const HOME_STILLS_QUERY = defineQuery(`
  *[_type == "siteSettings" && language == $lang][0]{
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
  "category": category->{ _id, title },
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
  "categories": *[_type == "rentalCategory" && language == $lang] | order(order asc){
    _id,
    title,
    "slug": slug.current
  },
  "items": *[_type == "rentalItem" && language == $lang && available != false] | order(order asc){
    ${RENTAL_ITEM_FIELDS}
  }
}`);

export const RENTAL_ITEM_QUERY = defineQuery(`
  *[_type == "rentalItem" && language == $lang && slug.current == $slug && available != false][0]{
    ${RENTAL_ITEM_FIELDS},
    specs[]{ _key, key, value },
    includedInKit
  }
`);

/** Just enough per item to label basket lines, which only store ids and quantities. */
export const QUOTE_CATALOGUE_QUERY = defineQuery(`
  *[_type == "rentalItem" && language == $lang && available != false]{
    _id,
    name,
    brand,
    maxQuantity,
    "slug": slug.current,
    "image": images[defined(asset)][0]{ alt, asset, crop, hotspot, "lqip": asset->metadata.lqip }
  }
`);

export const CONTACT_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings" && language == $lang][0]{ contactEmail, instagram }
`);

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
export const PAGE_TEXT_QUERY = defineQuery(`
  *[_type == "siteSettings" && language == $lang][0]{ rentalsIntro, quoteIntro, contactIntro }
`);
