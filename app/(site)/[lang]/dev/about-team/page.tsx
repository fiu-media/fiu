import type { Metadata } from "next";
import { PortableText } from "next-sanity";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AboutContacts } from "@/features/about";
import { TeamBand, TeamBeside, TeamScreen, type AboutTeamProps } from "@/app/(site)/[lang]/dev/_concepts/about/AboutTeamOptions";
import { railInset } from "@/components/layout/nav/rail";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import { GlassPillLink } from "@/components/ui/Glass";
import { fallbackStills } from "@/features/home";
import { defaultLocale, isLocale, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity } from "@/sanity/lib/live";
import { ABOUT_QUERY } from "@/content/siteSettings";
import { toSizedImage } from "@/sanity/lib/image";
import { toTeam } from "@/sanity/lib/team";

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

  const fallback = fallbackStills[0];
  const still = (settings.still ? toSizedImage(settings.still, 2400) : null) ?? {
    src: fallback.src,
    width: fallback.width,
    height: fallback.height,
    alt: fallback.alt,
    blurDataURL: fallback.blurDataURL,
  };
  const props: AboutTeamProps = {
    still,
    slogan: settings.slogan ?? null,
    gloss: settings.sloganGloss ?? null,
    manifesto: settings.manifesto?.length ? <PortableText value={settings.manifesto} /> : sampleManifesto,
    contacts: (
      <AboutContacts
        email={settings.contactEmail ?? "hello@example.com"}
        instagram={settings.instagram ?? "https://www.instagram.com/example/"}
        labels={{ email: dict.about.emailLabel, instagram: dict.about.instagramLabel }}
      />
    ),
    // From Site settings like the live pages; the badge marks a photo that is still the code's stand-in.
    team: { ...toTeam(settings, dict.about.teamHeading), placeholder: !settings.team },
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

async function getSettings(lang: Locale) {
  const { data } = await cachedSanity({
    query: ABOUT_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective: "published",
    stega: false,
  });
  return data;
}
