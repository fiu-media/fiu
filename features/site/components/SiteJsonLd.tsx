import { getSiteSettings } from "@/content/siteSettings";
import type { Locale } from "@/lib/i18n/config";

import { siteGraph } from "../jsonLd";
import { getSiteDefaults } from "../metadata";
import { JsonLd } from "./JsonLd";

/**
 * Structured data for search engines and answer engines, on Home: who Fiú Media is and what the site is called.
 * Published content only, so Home's shell stays static.
 */
export async function SiteJsonLd({ lang }: { lang: Locale }) {
  const [{ name, description }, { contact }] = await Promise.all([
    getSiteDefaults(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    <JsonLd
      data={siteGraph({
        name,
        description,
        email: contact.email,
        instagramUrl: contact.instagram?.href,
      })}
    />
  );
}
