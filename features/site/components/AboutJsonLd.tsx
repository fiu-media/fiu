import { getSiteSettings } from "@/content/siteSettings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

import { aboutGraph } from "../jsonLd";
import { getSiteDefaults } from "../metadata";
import { JsonLd } from "./JsonLd";

/**
 * Structured data on About: the same organisation entity as Home, plus an AboutPage that points at it. Published
 * content only, so the page's shell stays static.
 */
export async function AboutJsonLd({ lang }: { lang: Locale }) {
  const [{ name, description }, { contact }, { about }] = await Promise.all([
    getSiteDefaults(lang),
    getSiteSettings(lang, { draft: false }),
    getDictionary(lang),
  ]);
  return (
    <JsonLd
      data={aboutGraph({
        lang,
        title: about.title,
        name,
        description,
        email: contact.email,
        instagramUrl: contact.instagram?.href,
      })}
    />
  );
}
