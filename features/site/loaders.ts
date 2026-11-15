import type { MetadataRoute } from "next";

import { PROJECT_PAGES_QUERY } from "@/content/project";
import { RENTAL_PAGES_QUERY } from "@/content/rentalItem";
import { TALENT_PAGES_QUERY } from "@/content/talent";
import { features } from "@/lib/features";
import { defaultLocale } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/siteUrl";
import { fetchContent } from "@/sanity/lib/fetch";

import { toSitemap } from "./sitemap";

/**
 * The sitemap, from the published projects, people and (while Rentals is on) rental items. Published content only, so
 * it is cached like the pages and rebuilt when Sanity reports a change.
 */
export async function getSitemap(): Promise<MetadataRoute.Sitemap> {
  const published = { draft: false };
  const [projects, talent, rentals] = await Promise.all([
    fetchContent(PROJECT_PAGES_QUERY, defaultLocale, {}, published),
    fetchContent(TALENT_PAGES_QUERY, defaultLocale, {}, published),
    features.rentals ? fetchContent(RENTAL_PAGES_QUERY, defaultLocale, {}, published) : null,
  ]);
  return toSitemap({ projects, talent, rentals }, siteUrl);
}
