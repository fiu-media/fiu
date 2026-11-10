import type { ClientParams } from "next-sanity";

import { defaultLocale, type Locale } from "@/lib/i18n/config";

import { cachedSanity, getDynamicFetchOptions } from "./live";

type FetchOptions = {
  /**
   * Follow draft mode (the editors' perspective and variant) when it is on. `false` reads published content only,
   * so a page that doesn't need previews stays static.
   */
  draft?: boolean;
};

/**
 * Reads content for `lang`: every query gets `$lang` and `$fallbackLang` (the default locale) for free, and stega is
 * always off because pages render clean strings and add their own `data-sanity` attributes. Outside `sanity/lib`
 * this is the one place that should know about perspectives, variants and the cache boundary.
 */
export async function fetchContent<const Query extends string>(
  query: Query,
  lang: Locale,
  params: Record<string, unknown> = {},
  { draft = true }: FetchOptions = {},
) {
  const dynamic = draft ? await getDynamicFetchOptions() : { perspective: "published" as const };
  const { data } = await cachedSanity({
    query,
    // The generic query has no params type to check against yet, so say it matches.
    params: { lang, fallbackLang: defaultLocale, ...params } as ClientParams<Query>,
    perspective: dynamic.perspective,
    variant: "variant" in dynamic ? dynamic.variant : undefined,
    stega: false,
  });
  return data;
}
