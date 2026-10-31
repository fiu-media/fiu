import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AboutContacts } from "@/components/about/AboutContacts";
import { AboutFooter } from "@/components/about/AboutFooter";
import { AboutLayoutA, AboutLayoutB } from "@/components/about/AboutLayouts";
import { railInset } from "@/components/nav/rail";
import { SiteNav } from "@/components/nav/SiteNav";
import { GlassPillLink } from "@/components/ui/Glass";
import { fallbackStills } from "@/lib/fallback-stills";
import { defaultLocale, isLocale, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity } from "@/sanity/lib/live";
import type { AboutSettings } from "@/sanity/lib/about";
import { ABOUT_QUERY } from "@/sanity/lib/queries";
import { toSizedImage } from "@/sanity/lib/rentals";

// Sign-off page for the About layout (issue #55): two options on the real still, slogan and gloss.
// The manifesto is sample copy because the real text isn't written yet. Unlisted, like /dev/grids.
export const metadata: Metadata = {
  title: "About layout options",
  robots: { index: false, follow: false },
};

const OPTIONS = ["a", "b"] as const;
type Option = (typeof OPTIONS)[number];
const optionName: Record<Option, string> = { a: "Slogan first", b: "One screen" };

const sampleManifesto = (
  <>
    <p>
      <strong className="font-semibold text-white">At Fíu we believe in telling a new generation of stories.</strong>{" "}
      We&rsquo;re a production company, a home for Irish directors, cinematographers and editors, and a rental house for
      the kit we trust on our own sets.
    </p>
    <p className="text-white/75">
      Sample copy: the real manifesto comes from Fíu. This paragraph only shows how a longer text sits in each layout,
      so it runs on a little: we make original work, we make work for clients, and we make room for the people who make
      it with us.
    </p>
  </>
);

export default function AboutOptionsPage({ params, searchParams }: PageProps<"/[lang]/dev/about">) {
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
  const option: Option = OPTIONS.find((o) => o === requested) ?? "a";
  const [dict, settings] = await Promise.all([getDictionary(lang), getSettings(lang)]);

  const fallback = fallbackStills[0];
  const still = (settings?.still ? toSizedImage(settings.still, 2400) : null) ?? {
    src: fallback.src,
    width: fallback.width,
    height: fallback.height,
    alt: fallback.alt,
    blurDataURL: fallback.blurDataURL,
  };
  const props = {
    still,
    slogan: settings?.slogan ?? null,
    gloss: settings?.sloganGloss ?? null,
    manifesto: sampleManifesto,
    // Sample links until the editors have set the real ones.
    contacts: (
      <AboutContacts
        email={settings?.contactEmail ?? "hello@example.com"}
        instagram={settings?.instagram ?? "https://www.instagram.com/example/"}
        labels={{ email: dict.about.emailLabel, instagram: dict.about.instagramLabel }}
      />
    ),
    footer: <AboutFooter copyright={dict.footer.copyright} />,
  };

  return (
    <div data-surface="cinematic" className={`relative isolate bg-ink text-fg ${railInset}`}>
      <SiteNav lang={lang} onImage />
      {option === "a" ? <AboutLayoutA {...props} /> : <AboutLayoutB {...props} />}

      <nav
        aria-label="About layout options"
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2 md:ml-8"
      >
        {OPTIONS.map((o) => (
          <GlassPillLink
            key={o}
            size="sm"
            onImage
            scroll={false}
            href={`${localizedPath(lang, "/dev/about")}?option=${o}`}
            current={o === option}
            aria-label={`${o.toUpperCase()}: ${optionName[o]}`}
          >
            {o.toUpperCase()}
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
  return data as AboutSettings;
}
