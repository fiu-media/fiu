import { defineQuery } from "next-sanity";

import {
  arrayOrDefault,
  byRank,
  RENTAL_AVAILABLE,
  RENTAL_ITEM_FIELDS,
  RENTAL_ITEM_IDENTITY,
  RENTAL_ITEMS,
  withFallback,
} from "@/sanity/lib/groq";

export const RENTALS_QUERY = defineQuery(`{
  "categories": ${withFallback("rentalCategory", "")}${byRank("title")}{
    _id,
    title,
    "slug": slug.current
  },
  "items": ${RENTAL_ITEMS}${byRank("name")}{
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
  ${RENTAL_ITEMS}${byRank("name")}{
    ${RENTAL_ITEM_IDENTITY},
    "slug": slug.current,
    "image": ${arrayOrDefault("images[defined(asset)]")}[0]{ alt, asset, crop, hotspot, "lqip": asset->metadata.lqip }
  }
`);

/**
 * Rental items that can currently be requested (published and available). Basket lines hold the
 * default-language id, so only those documents match and names come out in the default language.
 */
export const AVAILABLE_ITEM_IDS_QUERY = defineQuery(`
  *[_type == "rentalItem" && language == $fallbackLang && _id in $ids${RENTAL_AVAILABLE}]{
    ${RENTAL_ITEM_IDENTITY}
  }
`);
