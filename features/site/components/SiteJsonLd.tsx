import { getSiteSettings } from "@/content/siteSettings";
import { dateLocale, type Locale, locales } from "@/lib/i18n/config";
import { absoluteUrl, siteUrl } from "@/lib/siteUrl";

import { getSiteDefaults } from "../metadata";

/** The company behind the trading name, as the privacy policy names it. */
const LEGAL_NAME = "Fiu Media Limited";

/**
 * Structured data for search engines, on Home only: who Fiú Media is (name, logo, how to reach it) and what the site
 * is called. A plain script tag, since this is data and not code to run; `<` is escaped so a value from the CMS can't
 * close the tag (see Next's JSON-LD guide). Published content only, so Home's shell stays static.
 */
export async function SiteJsonLd({ lang }: { lang: Locale }) {
  const [{ name, description }, { contact }] = await Promise.all([
    getSiteDefaults(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  const organization = `${siteUrl}/#organization`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organization,
        name,
        legalName: LEGAL_NAME,
        url: siteUrl,
        logo: absoluteUrl("/brand/fiu-avatar.png"),
        description,
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.instagram ? { sameAs: [contact.instagram.href] } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name,
        inLanguage: locales.map((locale) => dateLocale[locale]),
        publisher: { "@id": organization },
      },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />
  );
}
