import type { MetadataRoute } from "next";

import { getSitemap } from "@/features/site/loaders";

// Served at /sitemap.xml. Before launch the proxy answers that URL itself with just the two splash URLs (see `gate` in
// proxy.ts), so the projects and people aren't listed while the site is closed.
export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemap();
}
