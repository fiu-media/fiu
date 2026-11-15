import type { Metadata } from "next";

import { getSiteSettings } from "@/content/siteSettings";
import { type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMetadata } from "@/lib/routes";
import { type ShareImage, toShareImage } from "@/sanity/lib/image";

/** The white mark on ink (`scripts/logo/07_share_image.py`), shared until the editors upload a default share image. */
const BUNDLED_SHARE_IMAGE: ShareImage = { url: "/brand/og.png", width: 1200, height: 630 };

/** Open Graph's name for each locale. */
const OG_LOCALE: Record<Locale, string> = { en: "en_IE", ga: "ga_IE" };

/**
 * What the site calls itself where a page says nothing of its own: the editors' SEO fields in Site settings, else the
 * dictionary's. Published content only, so the pages that use it stay static.
 */
export async function getSiteDefaults(lang: Locale) {
  const [{ site }, { seoTitle, seoDescription, seoImage }] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return {
    name: site.name,
    title: seoTitle ?? site.name,
    description: seoDescription ?? site.description,
    image: (seoImage ? toShareImage(seoImage) : null) ?? BUNDLED_SHARE_IMAGE,
  };
}

type PageMeta = {
  /** Without one the page takes the site's default title (Home). */
  title?: string | undefined;
  description?: string | undefined;
  /** The page's own picture for link previews (a project's cover, a person's portrait). */
  image?: ShareImage | null | undefined;
  robots?: Metadata["robots"];
};

/**
 * A page's whole metadata: its title and description, the canonical and hreflang links (`pageMetadata`), and what a
 * link preview shows. Next replaces `openGraph` as a whole from one segment to the next instead of merging it, so
 * every page gets the complete object here, with the site's defaults filled in.
 */
export async function siteMetadata(
  lang: Locale,
  path: string,
  { title, description, image, robots }: PageMeta = {},
): Promise<Metadata> {
  const defaults = await getSiteDefaults(lang);
  const shared = {
    title: title ?? defaults.title,
    description: description ?? defaults.description,
    images: [{ alt: defaults.name, ...(image ?? defaults.image) }],
  };
  return pageMetadata(lang, path, {
    ...(title ? { title } : {}),
    description: shared.description,
    ...(robots ? { robots } : {}),
    openGraph: {
      ...shared,
      type: "website",
      url: localizedPath(lang, path),
      siteName: defaults.name,
      locale: OG_LOCALE[lang],
    },
    twitter: { card: "summary_large_image", ...shared },
  });
}
