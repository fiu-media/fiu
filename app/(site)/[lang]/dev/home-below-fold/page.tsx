import { ArrowDown } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PortableText } from "next-sanity";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AboutContacts } from "@/components/about/AboutContacts";
import {
  FoldIndex,
  FoldReelClosing,
  FoldReelStrip,
  FoldReelTeamCard,
  FoldReelTeamLead,
  FoldSnapSequel,
  FoldTwoDoors,
  type FoldProject,
  type FoldProps,
} from "@/components/home/BelowFoldOptions";
import { railInset } from "@/components/nav/rail";
import { SiteNav } from "@/components/nav/SiteNav";
import { GlassPillLink } from "@/components/ui/Glass";
import { fallbackStills } from "@/lib/fallback-stills";
import { defaultLocale, isLocale, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity } from "@/sanity/lib/live";
import { ABOUT_QUERY, WORK_QUERY } from "@/sanity/lib/queries";
import { toSizedImage, type SizedImage } from "@/sanity/lib/rentals";
import { toTeam } from "@/sanity/lib/team";
import logo from "@/public/brand/fiu-logo.svg";

// Sign-off page for the condensed About + Our Work under Home's first screen: seven options (A to D, then three reel strips that also carry the team photo, email and Instagram) on the real slogan, About
// still and projects. Unlisted, like /dev/about. The first screen here is a stand-in (a still and the flat logo): the
// live WebGL hero isn't needed to judge the fold, and Home's mobile scroll lock isn't applied.
export const metadata: Metadata = {
  title: "Home below the fold",
  robots: { index: false, follow: false },
};

const OPTIONS = ["a", "b", "c", "d", "e", "f", "g"] as const;
type Option = (typeof OPTIONS)[number];
const optionName: Record<Option, string> = {
  a: "Reel strip",
  b: "Statement + index",
  c: "Two doors",
  d: "Snap sequel",
  e: "Reel + team card",
  f: "Reel + team lead",
  g: "Reel + closing band",
};
const folds = {
  a: FoldReelStrip,
  b: FoldIndex,
  c: FoldTwoDoors,
  d: FoldSnapSequel,
  e: FoldReelTeamCard,
  f: FoldReelTeamLead,
  g: FoldReelClosing,
} satisfies Record<Option, (props: FoldProps) => React.ReactNode>;

// Sample copy for what the editors haven't written yet (and for an empty dataset).
const sampleSlogan = "Telling a new generation of stories.";
const sampleSummary = (
  <p>
    We&rsquo;re a production company, a home for Irish directors, cinematographers and editors, and a rental house for the kit we
    trust on our own sets.
  </p>
);
const sampleProjects = ["Solas", "Cuan", "An Tine", "Fothrach", "Réalta"];

// English only for now; the Irish text comes from Fíu once an option is picked.
const labels: FoldProps["labels"] = {
  about: "About",
  work: "Our Work",
  aboutCta: "About us",
  workCta: "All work",
  view: "View project",
};

export default function HomeBelowFoldPage({ params, searchParams }: PageProps<"/[lang]/dev/home-below-fold">) {
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
  const [dict, { about, projects }] = await Promise.all([getDictionary(lang), getContent(lang)]);

  const props: FoldProps = {
    about: {
      slogan: about.slogan ?? sampleSlogan,
      gloss: about.sloganGloss ?? null,
      // Only the first paragraph: this is the condensed version.
      summary: about.manifesto?.length ? <PortableText value={about.manifesto.slice(0, 1)} /> : sampleSummary,
      still: about.still,
      href: localizedPath(lang, "/about"),
    },
    // From Site settings like the live pages; the badge marks a photo that is still the code's stand-in.
    team: { ...toTeam(about, dict.about.teamHeading), placeholder: !about.team },
    // Sample links until the editors have set the real ones.
    contacts: (
      <AboutContacts
        email={about.contactEmail ?? "hello@example.com"}
        instagram={about.instagram ?? "https://www.instagram.com/example/"}
        labels={{ email: dict.about.emailLabel, instagram: dict.about.instagramLabel }}
      />
    ),
    projects,
    workHref: localizedPath(lang, "/work"),
    labels,
  };
  const Fold = folds[option];

  return (
    <div data-surface="cinematic" className={`relative isolate bg-ink text-fg ${railInset}`}>
      <SiteNav lang={lang} onImage />

      {/* Stand-in for Home's first screen. */}
      <header className="relative isolate grid h-dvh snap-start place-items-center overflow-hidden">
        <Image
          src={fallbackStills[0].src}
          width={fallbackStills[0].width}
          height={fallbackStills[0].height}
          alt=""
          priority
          sizes="100vw"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <Image src={logo} alt="" priority className="h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none" />
        <ArrowDown aria-hidden className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] size-5 text-white/70" />
      </header>

      <main>
        <Fold {...props} />
      </main>

      <nav
        aria-label="Below the fold options"
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2 md:top-[calc(var(--dev-bar,2.5rem)+0.75rem)] md:bottom-auto md:ml-8"
      >
        {OPTIONS.map((o) => (
          <GlassPillLink
            key={o}
            size="sm"
            onImage
            scroll={false}
            href={`${localizedPath(lang, "/dev/home-below-fold")}?option=${o}`}
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

async function getContent(lang: Locale) {
  const params = { lang, fallbackLang: defaultLocale };
  const [{ data: aboutData }, { data: workData }] = await Promise.all([
    cachedSanity({ query: ABOUT_QUERY, params, perspective: "published", stega: false }),
    cachedSanity({ query: WORK_QUERY, params, perspective: "published", stega: false }),
  ]);

  const fallback = fallbackStills[0];
  const fallbackImage: SizedImage = {
    src: fallback.src,
    width: fallback.width,
    height: fallback.height,
    alt: fallback.alt,
    blurDataURL: fallback.blurDataURL,
  };
  const still = (aboutData.still ? toSizedImage(aboutData.still, 2400) : null) ?? fallbackImage;

  const real: FoldProject[] = workData.projects
    .map((project) => {
      const image = project.cover ? toSizedImage(project.cover, 1600) : null;
      if (!image || !project.slug) return null;
      return {
        id: project._id,
        title: project.title,
        meta: [project.type, project.year, project.client].filter(Boolean).join(" · "),
        image,
        href: localizedPath(lang, `/work/${project.slug}`),
      };
    })
    .filter((project) => project !== null)
    .slice(0, 5);

  // The options need a handful of projects to be judged fairly, so pad with samples until the real ones fill the row.
  const samples: FoldProject[] = sampleProjects.map((title, i) => {
    const s = fallbackStills[(i + 1) % fallbackStills.length]!;
    return {
      id: `sample-${title}`,
      title,
      meta: "Documentary · 2026",
      image: { src: s.src, width: s.width, height: s.height, alt: "", blurDataURL: s.blurDataURL },
      href: localizedPath(lang, "/work"),
    };
  });
  const projects = [...real, ...samples].slice(0, Math.max(real.length, 5));

  return { about: { ...aboutData, still }, projects };
}
