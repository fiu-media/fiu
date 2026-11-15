import type { MetadataRoute } from "next";

import { defaultLocale, isLocale, type Locale, locales, localizedPath } from "@/lib/i18n/config";
import { routes } from "@/lib/routes";

/** A document that has a page of its own, as the sitemap queries return it: one row per language it exists in. */
type PageDoc = { slug: string | null; language: string | null; _updatedAt: string };

export type SitemapContent = {
  projects: PageDoc[];
  talent: PageDoc[];
  /** `null` while Rentals is hidden: its pages are a 404 then, so none are listed. */
  rentals: PageDoc[] | null;
};

/** A page, the languages it can be read in, and when its content last changed (unknown for the fixed pages). */
type Page = { path: string; locales: readonly Locale[]; lastModified?: string };

/**
 * One page per slug. A document in the default language is shown in every language (the others fall back to it); one
 * that only exists in a translation has a page in that language alone. The date is the latest edit to any of them.
 */
function toPages(docs: PageDoc[], toPath: (slug: string) => string): Page[] {
  const bySlug = new Map<string, { languages: Set<string>; lastModified: string }>();
  for (const { slug, language, _updatedAt } of docs) {
    if (!slug) continue;
    const page = bySlug.get(slug) ?? { languages: new Set<string>(), lastModified: _updatedAt };
    page.languages.add(language ?? defaultLocale);
    if (_updatedAt > page.lastModified) page.lastModified = _updatedAt;
    bySlug.set(slug, page);
  }
  return [...bySlug].map(([slug, { languages, lastModified }]) => ({
    path: toPath(slug),
    locales: languages.has(defaultLocale) ? locales : [...languages].filter(isLocale),
    lastModified,
  }));
}

/** `path` in `locale` as an absolute URL on `origin` (no trailing slash); the default-language home is the bare origin. */
function pageUrl(origin: string, locale: Locale, path: string) {
  const localized = localizedPath(locale, path);
  return localized === "/" ? origin : `${origin}${localized}`;
}

/** The entries for pages that exist in `available`, each listing its other-language twins so search engines pair them up. */
function toEntries(pages: Page[], origin: string): MetadataRoute.Sitemap {
  return pages.flatMap(({ path, locales: available, lastModified }) =>
    available.map((locale) => ({
      url: pageUrl(origin, locale, path),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: Object.fromEntries(available.map((other) => [other, pageUrl(origin, other, path)])) },
    })),
  );
}

/**
 * The sitemap: every public page in every language it can be read in, each listing its other-language twins so search
 * engines pair them up. `origin` is the site's public URL without a trailing slash.
 */
export function toSitemap({ projects, talent, rentals }: SitemapContent, origin: string): MetadataRoute.Sitemap {
  const fixed = [routes.home(), routes.about(), routes.work(), routes.talent(), routes.contact(), routes.privacy()];
  return toEntries(
    [
      ...fixed.map((path) => ({ path, locales })),
      ...toPages(projects, routes.project),
      ...toPages(talent, routes.person),
      ...(rentals ? [{ path: routes.rentals(), locales }, ...toPages(rentals, routes.rentalItem)] : []),
    ],
    origin,
  );
}

/** Before launch the only pages Google may know about are the splash's two home URLs; nothing unreleased is listed. */
export function toSplashSitemap(origin: string): MetadataRoute.Sitemap {
  return toEntries([{ path: routes.home(), locales }], origin);
}

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ESCAPES[character] ?? character);

/**
 * `entries` as sitemap XML, with the language twins as `xhtml:link` alternates (what Next writes for `app/sitemap.ts`).
 * For the proxy, which can't use that file convention to answer before launch.
 */
export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map(({ url, lastModified, alternates }) => {
    const links = Object.entries(alternates?.languages ?? {}).map(
      ([hreflang, href]) => `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(String(href))}" />`,
    );
    const modified = lastModified ? [`<lastmod>${escapeXml(String(lastModified))}</lastmod>`] : [];
    return `<url><loc>${escapeXml(url)}</loc>${[...links, ...modified].join("")}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>\n`;
}
