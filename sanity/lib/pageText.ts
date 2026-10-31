import type { PAGE_TEXT_QUERY_RESULT } from "@/sanity.types";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { cachedSanity } from "./live";
import { PAGE_TEXT_QUERY } from "./queries";

/**
 * The intro lines under the Rentals, Request a quote, Contact, Our Work and Talent titles, and the Fiú line
 * under each page title, written in Site settings. Published content only, so the pages stay static.
 */
export async function getPageText(lang: Locale): Promise<PAGE_TEXT_QUERY_RESULT> {
  const { data } = await cachedSanity({ query: PAGE_TEXT_QUERY, params: { lang, fallbackLang: defaultLocale }, perspective: "published", stega: false });
  return data;
}
