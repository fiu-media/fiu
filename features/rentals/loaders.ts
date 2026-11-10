import {
  QUOTE_CATALOGUE_QUERY,
  RENTAL_ITEM_QUERY,
  RENTALS_QUERY,
  toCatalogue,
  toQuoteCatalogue,
  toRentalItem,
} from "@/content/rentalItem";
import type { Locale } from "@/lib/i18n/config";
import { fetchContent } from "@/sanity/lib/fetch";

/** The catalogue in `lang`. Follows draft mode, so it must sit behind a Suspense boundary. */
export async function getCatalogue(lang: Locale) {
  return toCatalogue(await fetchContent(RENTALS_QUERY, lang));
}

/** One item page's content, or `null` when there is no such (available) item. Follows draft mode like the catalogue. */
export async function getRentalItem(lang: Locale, slug: string) {
  return toRentalItem(await fetchContent(RENTAL_ITEM_QUERY, lang, { slug }));
}

/** Labels for basket lines. Published content only, so it is cached and keeps the shell static. */
export async function getQuoteCatalogue(lang: Locale) {
  return toQuoteCatalogue(lang, await fetchContent(QUOTE_CATALOGUE_QUERY, lang, {}, { draft: false }));
}
