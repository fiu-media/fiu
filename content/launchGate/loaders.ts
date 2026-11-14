import type { Locale } from "@/lib/i18n/config";
import { fetchContent } from "@/sanity/lib/fetch";

import { LAUNCH_AT_QUERY } from "./queries";
import { toLaunchAt } from "./read";

/**
 * The launch date for the splash page, published content only. Unlike the proxy's read (`getLaunchAt`) this goes
 * through the page cache, which Sanity Live refreshes when the date is edited, so the page stays static.
 */
export async function getLaunchDate(lang: Locale): Promise<Date | null> {
  return toLaunchAt(await fetchContent(LAUNCH_AT_QUERY, lang, {}, { draft: false }));
}
