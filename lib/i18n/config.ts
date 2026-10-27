export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];

/** Served without a URL prefix; proxy.ts rewrites it to `/en/...` internally. */
export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/** Public URL path for `path` in `lang`: the default locale is unprefixed, others get `/<lang>`. */
export function localizedPath(lang: Locale, path: string): string {
  if (lang === defaultLocale) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Metadata `alternates` (canonical + hreflang) for `path`; each page spreads this into its own metadata. */
export function languageAlternates(lang: Locale, path: string) {
  return {
    canonical: localizedPath(lang, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localizedPath(l, path)])),
      "x-default": localizedPath(defaultLocale, path),
    },
  };
}
