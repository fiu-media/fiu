import type { Metadata } from "next";

import { languageAlternates, type Locale, localizedPath } from "./i18n/config";

/** Every page on the site, as an unprefixed path. Wrap one in `href(lang, …)` for a link. */
export const routes = {
  home: () => "/",
  about: () => "/about",
  work: () => "/work",
  project: (slug: string) => `/work/${slug}`,
  talent: () => "/talent",
  person: (slug: string) => `/talent/${slug}`,
  rentals: () => "/rentals",
  rentalItem: (slug: string) => `/rentals/${slug}`,
  quote: () => "/rentals/quote",
  contact: () => "/contact",
  privacy: () => "/privacy",
} as const;

/** Public URL for `path` in `lang`: the default locale is unprefixed, others get `/<lang>`. */
export const href = (lang: Locale, path: string) => localizedPath(lang, path);

/** A page's metadata with its canonical and hreflang alternates added, so pages name their path once. */
export function pageMetadata(lang: Locale, path: string, meta: Metadata = {}): Metadata {
  return { ...meta, alternates: languageAlternates(lang, path) };
}
