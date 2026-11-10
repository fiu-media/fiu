import { notFound } from "next/navigation";

export const locales = ["en", "ga"] as const;
export type Locale = (typeof locales)[number];

/** Each language's own name, as the switcher and the Studio show it. */
export const localeNames: Record<Locale, string> = { en: "English", ga: "Gaeilge" };

/** BCP-47 tag used to format dates and numbers for each locale. */
export const dateLocale: Record<Locale, string> = { en: "en-IE", ga: "ga-IE" };

/** Served without a URL prefix; proxy.ts rewrites it to `/en/...` internally. */
export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/** The `lang` route param as a `Locale`; an unknown value is a 404. */
export async function getLocale(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}

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

/** Remembers a visitor's explicit choice of language (set by the switcher); it beats the browser's preference. */
export const languageCookie = "fiu-lang";

/** The same page in `to`, from a public pathname in any locale (`/ga/work` → `/work`). */
export function switchLocalePath(pathname: string, to: Locale): string {
  const current = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  const path = current ? pathname.slice(current.length + 1) || "/" : pathname || "/";
  return localizedPath(to, path);
}
