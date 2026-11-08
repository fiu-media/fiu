import { defineQuery } from "next-sanity";
import {
  arrayOrDefault,
  byRank,
  DEFAULT_COUNTERPART,
  RENTAL_AVAILABLE,
  RENTAL_ITEM_FIELDS,
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
    _id,
    "baseId": coalesce(${DEFAULT_COUNTERPART}._id, _id),
    "name": coalesce(${DEFAULT_COUNTERPART}.name, name),
    "brand": coalesce(${DEFAULT_COUNTERPART}.brand, brand),
    "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity),
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
    _id, name, brand,
    "maxQuantity": coalesce(${DEFAULT_COUNTERPART}.maxQuantity, maxQuantity)
  }
`);
