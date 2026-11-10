import "./seams.css";

import { ArrowDown } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { Suspense } from "react";

import {
  FoldIndex,
  type FoldProject,
  type FoldProps,
  FoldReelClosing,
  FoldReelStrip,
  FoldReelTeamCard,
  FoldReelTeamLead,
  FoldSnapSequel,
  FoldTwoDoors,
} from "@/app/(site)/[lang]/dev/_concepts/home/BelowFoldOptions";
import { railInset, railWidth } from "@/components/layout/nav/rail";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import { GlassPillLink } from "@/components/ui/Glass";
import { WORK_QUERY } from "@/content/project";
import { ContactLinks, getSiteSettings, toTeam } from "@/content/siteSettings";
import { fallbackStills, HeroFade } from "@/features/home";
import { cn } from "@/lib/cn";
import { isLocale, type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import logo from "@/public/brand/fiu-logo.svg";
import { fetchContent } from "@/sanity/lib/fetch";
import { toSizedImage } from "@/sanity/lib/image";

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

// How the hero meets the fold. Home ships "none" (a hard edge at the fold, so the first screen is the still alone); the
// others are kept for comparison. Fade dissolves the foot of the first screen into ink. Mirror, Light spill and Frame edge
// leave the first screen whole and add 14dvh below it: a reflection of the still, its colours spilt as soft light, or a
// hairline at the cut. Lights down dims the still as it scrolls away. Frosted rail and Fade + rail are the older rail looks.
const SEAMS = ["none", "fade", "mirror", "spill", "frame", "lights", "rail", "both"] as const;
type Seam = (typeof SEAMS)[number];
const seamName: Record<Seam, string> = {
  none: "Hard edge",
  fade: "Fade",
  mirror: "Mirror",
  spill: "Light spill",
  frame: "Frame edge",
  lights: "Lights down",
  rail: "Frosted rail",
  both: "Fade + rail",
};
/** These seams draw below the first screen, so it is followed by 14dvh of room for them. */
const tailSeams: readonly Seam[] = ["mirror", "spill"];

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
  const { option: requested, seam: requestedSeam } = await searchParams;
  const option: Option = OPTIONS.find((o) => o === requested) ?? "a";
  const seam: Seam = SEAMS.find((s) => s === requestedSeam) ?? "none";
  const tail = tailSeams.includes(seam);
  const href = (o: Option, s: Seam) => `${localizedPath(lang, "/dev/home-below-fold")}?option=${o}&seam=${s}`;
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
    team: { ...toTeam(about, dict.about.teamHeading), placeholder: !about.teamStill },
    // Sample links until the editors have set the real ones.
    contacts: (
      <ContactLinks
        variant="list"
        contact={{
          email: about.contact.email ?? "hello@example.com",
          instagram: about.contact.instagram ?? { href: "https://www.instagram.com/example/", handle: "@example" },
        }}
        labels={dict.contactLinks}
      />
    ),
    projects,
    workHref: localizedPath(lang, "/work"),
    labels,
  };
  const Fold = folds[option];

  return (
    // The hero runs under the rail, as on Home; only the fold is set beside it.
    <div data-surface="cinematic" className="relative isolate bg-ink text-fg">
      {/* The "frosted rail" seam option: a blur over the rail's strip, under the nav (which is z-30). */}
      {(seam === "rail" || seam === "both") && (
        <div aria-hidden className={cn("fixed inset-y-0 left-0 z-20 hidden backdrop-blur-md md:block", railWidth)} />
      )}
      <SiteNav lang={lang} onImage />

      {/* Stand-in for Home's first screen, plus room below it for the seams that draw there. */}
      <div className={cn(tail && "overflow-hidden pb-[14dvh]")}>
        <header
          className={cn(
            "relative isolate grid h-dvh snap-start place-items-center",
            !tail && "overflow-hidden",
            seam === "lights" && "seam-lights",
          )}
        >
          <Image
            src={fallbackStills[0].src}
            width={fallbackStills[0].width}
            height={fallbackStills[0].height}
            alt=""
            priority
            sizes="100vw"
            className={cn("absolute inset-0 -z-10 size-full object-cover", seam === "mirror" && "seam-mirror")}
          />
          {seam === "spill" && (
            <div aria-hidden className="seam-spill">
              <div style={{ backgroundImage: `url("${fallbackStills[0].blurDataURL}")` }} />
            </div>
          )}
          {seam === "frame" && <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/12" />}
          <Image src={logo} alt="" priority className="h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none" />
          {/* Under the logo, above the photo: in the real hero it sits between the stills and the logo layers. */}
          {(seam === "fade" || seam === "both") && <HeroFade className="-z-10" />}
          <ArrowDown aria-hidden className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] size-5 text-white/70" />
        </header>
      </div>

      <main className={railInset}>
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
            href={href(o, seam)}
            current={o === option}
            aria-label={`${o.toUpperCase()}: ${optionName[o]}`}
          >
            {o.toUpperCase()}
            <span className="max-sm:hidden"> · {optionName[o]}</span>
          </GlassPillLink>
        ))}
      </nav>

      <nav
        aria-label="Hero seam options"
        className="fixed bottom-16 left-1/2 z-40 flex -translate-x-1/2 gap-2 md:top-[calc(var(--dev-bar,2.5rem)+3.25rem)] md:bottom-auto md:ml-8"
      >
        {SEAMS.map((s) => (
          <GlassPillLink key={s} size="sm" onImage scroll={false} href={href(option, s)} current={s === seam}>
            {seamName[s]}
          </GlassPillLink>
        ))}
      </nav>
    </div>
  );
}

async function getContent(lang: Locale) {
  const [aboutData, workData] = await Promise.all([
    getSiteSettings(lang, { draft: false }),
    fetchContent(WORK_QUERY, lang, {}, { draft: false }),
  ]);

  const still = (aboutData.aboutStill ? toSizedImage(aboutData.aboutStill, 2400) : null) ?? fallbackStills[0]!;

  const real: FoldProject[] = workData.projects
    .map((project) => {
      const image = project.cover.landscape ? toSizedImage(project.cover.landscape, 1600) : null;
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
