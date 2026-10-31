import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { cachedSanity } from "./live";
import { PAGE_TEXT_QUERY } from "./queries";

type PageText = {
  rentalsIntro: string | null;
  quoteIntro: string | null;
  contactIntro: string | null;
  workIntro: string | null;
  talentIntro: string | null;
  aboutTagline: string | null;
  workTagline: string | null;
  talentTagline: string | null;
  rentalsTagline: string | null;
  contactTagline: string | null;
};

const EMPTY: PageText = {
  rentalsIntro: null,
  quoteIntro: null,
  contactIntro: null,
  workIntro: null,
  talentIntro: null,
  aboutTagline: null,
  workTagline: null,
  talentTagline: null,
  rentalsTagline: null,
  contactTagline: null,
};

/**
 * The intro lines under the Rentals, Request a quote, Contact, Our Work and Talent titles, and the Fiú line
 * under each page title, written in Site settings. Published content only, so the pages stay static.
 */
export async function getPageText(lang: Locale): Promise<PageText> {
  const { data } = await cachedSanity({ query: PAGE_TEXT_QUERY, params: { lang, fallbackLang: defaultLocale }, perspective: "published", stega: false });
  return (data as PageText | null) ?? EMPTY;
}
