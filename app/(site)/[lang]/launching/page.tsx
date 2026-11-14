import type { Metadata } from "next";

import { getLaunchDate } from "@/content/launchGate";
import { getSiteSettings } from "@/content/siteSettings";
import { LaunchSplash } from "@/features/gate";
import { formatDateInDublin } from "@/lib/dates";
import { dateLocale, getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cinematicViewport } from "@/lib/theme";

// The proxy shows this in place of every page until the launch date. It must never be indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };
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
