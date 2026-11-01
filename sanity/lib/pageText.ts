import type { InferResultType } from "groqd";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { fetchQuery } from "./live";
import { PAGE_TEXT_QUERY } from "./queries";

/**
 * The intro lines under the Rentals, Request a quote, Contact, Our Work and Talent titles, and the Fiú line
 * under each page title, written in Site settings. Published content only, so the pages stay static.
 */
export async function getPageText(lang: Locale): Promise<InferResultType<typeof PAGE_TEXT_QUERY>> {
  const data = await fetchQuery(PAGE_TEXT_QUERY, { parameters: { lang, fallbackLang: defaultLocale }, perspective: "published", stega: false });
  return data;
}
