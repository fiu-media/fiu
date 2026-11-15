import type { Metadata } from "next";

import { getLaunchDate } from "@/content/launchGate";
import { getSiteSettings } from "@/content/siteSettings";
import { LaunchSplash } from "@/features/gate";
import { siteMetadata } from "@/features/site";
import { formatDateInDublin } from "@/lib/dates";
import { dateLocale, getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { routes } from "@/lib/routes";
import { cinematicViewport } from "@/lib/theme";

// The proxy shows this in place of every page until the launch date. Whether a URL may be indexed is the proxy's call
// (`X-Robots-Tag`: only `/` and `/ga` are open), and a `noindex` here would override it. Every URL names the home page
// as its canonical, so a duplicate that slips through still points at the front door.
export async function generateMetadata({ params }: PageProps<"/[lang]/launching">): Promise<Metadata> {
  return siteMetadata(await getLocale(params), routes.home());
}
export const viewport = cinematicViewport;

export default async function LaunchingPage({ params }: PageProps<"/[lang]/launching">) {
  const lang = await getLocale(params);
  const [dict, launchAt, settings] = await Promise.all([
    getDictionary(lang),
    getLaunchDate(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    <LaunchSplash
      lang={lang}
      languageLabel={dict.nav.language}
      name={dict.site.name}
      date={launchAt ? formatDateInDublin(launchAt, dateLocale[lang]) : null}
      slogan={settings.slogan ?? null}
      email={settings.contact.email}
      emailLabel={dict.contactLinks.email}
    />
  );
}
