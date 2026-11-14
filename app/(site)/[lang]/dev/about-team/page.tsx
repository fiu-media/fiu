import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { Suspense } from "react";

import { type AboutTeamProps, TeamBand, TeamBeside, TeamScreen } from "@/app/(site)/[lang]/dev/_concepts/about/AboutTeamOptions";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import { GlassPillLink } from "@/components/ui/Glass";
import { ContactLinks, fallbackStills, getSiteSettings, toTeam } from "@/content/siteSettings";
import { at } from "@/lib/at";
import { isLocale, type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { railInset } from "@/lib/rail";
import { toSizedImage } from "@/sanity/lib/image";

// Sign-off page for where the team photo goes on About: three placements on the About layout (option A). Option 2 is live
// at /about, with the photo from Site settings. The
// photo and caption come from Site settings (a stand-in until Fiú has uploaded one). Unlisted, like /dev/about.
export const metadata: Metadata = {
  title: "About team photo options",
  robots: { index: false, follow: false },
};

const OPTIONS = ["1", "2", "3"] as const;
type Option = (typeof OPTIONS)[number];
const optionName: Record<Option, string> = { "1": "Group portrait", "2": "Beside the words", "3": "Second screen" };
const layouts = { "1": TeamBand, "2": TeamBeside, "3": TeamScreen } satisfies Record<
  Option,
  (p: AboutTeamProps) => React.ReactNode
>;

const sampleManifesto = (
  <>
    <p>
      <strong className="font-semibold text-white">At Fíu we believe in telling a new generation of stories.</strong> We&rsquo;re
      a production company, a home for Irish directors, cinematographers and editors, and a rental house for the kit we trust on
      our own sets.
    </p>
    <p className="text-white/70">
      We make original work, we make work for clients, and we make room for the people who make it with us.
    </p>
  </>
);

export default function AboutTeamOptionsPage({ params, searchParams }: PageProps<"/[lang]/dev/about-team">) {
  return (
    <Suspense>
      <Options params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Options({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { option: requested } = await searchParams;
  const option: Option = OPTIONS.find((o) => o === requested) ?? "1";
  const [dict, settings] = await Promise.all([getDictionary(lang), getSettings(lang)]);

  const still = (settings.aboutStill ? toSizedImage(settings.aboutStill, 2400) : null) ?? at(fallbackStills, 0);
  const props: AboutTeamProps = {
    still,
    slogan: settings.slogan ?? null,
    gloss: settings.sloganGloss ?? null,
    scrollLabel: dict.common.scrollDown,
    manifesto: settings.manifesto?.length ? <PortableText value={settings.manifesto} /> : sampleManifesto,
    contacts: (
      <ContactLinks
        variant="list"
        contact={{
          email: settings.contact.email ?? "hello@example.com",
          instagram: settings.contact.instagram ?? { href: "https://www.instagram.com/example/", handle: "@example" },
        }}
        labels={dict.contactLinks}
      />
    ),
    // From Site settings like the live pages; the badge marks a photo that is still the code's stand-in.
    team: { ...toTeam(settings, dict.about.teamHeading), placeholder: !settings.teamStill },
  };
  const Layout = layouts[option];

  return (
    <div data-surface="cinematic" className={`relative isolate bg-ink text-fg ${railInset}`}>
      <SiteNav lang={lang} onImage />
      <Layout {...props} />

      <nav
        aria-label="Team photo options"
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2 md:top-[calc(var(--dev-bar,2.5rem)+0.75rem)] md:bottom-auto md:ml-8"
      >
        {OPTIONS.map((o) => (
          <GlassPillLink
            key={o}
            size="sm"
            onImage
            scroll={false}
            href={`${localizedPath(lang, "/dev/about-team")}?option=${o}`}
            current={o === option}
            aria-label={`${o}: ${optionName[o]}`}
          >
            {o}
            <span className="max-sm:hidden"> · {optionName[o]}</span>
          </GlassPillLink>
        ))}
      </nav>
    </div>
  );
}

const getSettings = (lang: Locale) => getSiteSettings(lang, { draft: false });
