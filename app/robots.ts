import type { MetadataRoute } from "next";

import { locales, localizedPath } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/siteUrl";

/** Kept out of search results in every language: the staff-only sign-off pages and the pre-launch splash. */
const PRIVATE_PATHS = ["/dev", "/launching"];

// Served at /robots.txt, before launch too: a crawler has to be let in to see the `noindex` the launch gate sends.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...locales.flatMap((locale) => PRIVATE_PATHS.map((path) => localizedPath(locale, path)))],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
