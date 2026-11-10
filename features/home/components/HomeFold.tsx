import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { pageGutter } from "@/components/layout/nav/rail";
import { GlassPillLink } from "@/components/ui/Glass";
import { SizedImg } from "@/components/ui/SizedImg";
import { type Team, TeamFigure } from "@/content/siteSettings";
import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/image";

/** The condensed About: the slogan, its gloss and the first paragraph of the manifesto, with the About still. */
type FoldAbout = {
  slogan: string;
  gloss: string | null;
  /** One paragraph, already rendered. */
  summary: ReactNode;
  still: SizedImage;
  href: string;
};

export type FoldProject = {
  id: string;
  title: string;
  /** Type · year · client. */
  meta: string;
  image: SizedImage;
  href: string;
};

type FoldTeam = Team;

export type FoldProps = {
  about: FoldAbout;
  team: FoldTeam;
  /** `data-sanity` value for the team photo in the Presentation tool. */
  teamAttribute?: string | undefined;
  /** The email and Instagram links, already rendered (see ContactLinks). */
  contacts: ReactNode;
  /** The first few projects in the editors' order. */
  projects: FoldProject[];
  workHref: string;
  labels: { about: string; work: string; aboutCta: string; workCta: string; view: string };
};

/** A photo that fills its (relative, overflow-hidden) parent. */
export function Photo({
  image,
  sizes,
  className,
  priority,
}: {
  image: SizedImage;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return <SizedImg image={image} sizes={sizes} priority={priority} className={cn("size-full", className)} />;
}

/** The row of project covers you swipe or scroll sideways. `children` sit between the last cover and "All work". */
export function Reel({
  projects,
  workHref,
  labels,
  className,
  children,
}: Pick<FoldProps, "projects" | "workHref" | "labels"> & { className?: string; children?: ReactNode }) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={labels.work}
      className={cn(
        "flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-4 overflow-x-auto pb-4 md:scroll-px-10 md:gap-6 [&::-webkit-scrollbar]:hidden",
        pageGutter,
        className,
      )}
    >
      {projects.map((project) => (
        <Link key={project.id} href={project.href} className="group w-[78vw] shrink-0 snap-start md:w-[30rem]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl md:aspect-[4/3]">
            <Photo
              image={project.image}
              sizes="(min-width: 768px) 30rem, 78vw"
              className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>
          <h3 className="mt-4 font-display text-2xl md:text-3xl">{project.title}</h3>
          <p className="mt-1 text-sm text-on-image/60">{project.meta}</p>
        </Link>
      ))}
      {children}
      <div className="flex w-[60vw] shrink-0 snap-start items-center justify-center md:w-64">
        <GlassPillLink href={workHref} onImage size="lg">
          {labels.workCta}
          <ArrowRight aria-hidden className="size-4" />
        </GlassPillLink>
      </div>
    </div>
  );
}

/** What Home passes: the sign-off options also use the About still, which the fold doesn't. */
export type HomeFoldProps = Omit<FoldProps, "about"> & { about: Omit<FoldAbout, "still"> };

/**
 * What sits under Home's first screen: the team photo beside the slogan, the first paragraph of the manifesto, the
 * email and Instagram links and "About us", then a strip of projects ending in "All work". Same pairing and crops as
 * the About page's team photo, so one photo serves both.
 */
export function HomeFold({ about, team, teamAttribute, contacts, projects, workHref, labels }: HomeFoldProps) {
  return (
    <section aria-label={labels.about} className="bg-ink py-20 text-fg md:py-28">
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20",
          pageGutter,
        )}
      >
        <TeamFigure team={team} attribute={teamAttribute} />
        <div className="flex flex-col items-start gap-6">
          <h2 className="font-display text-4xl leading-[1.05] text-balance italic md:text-5xl">{about.slogan}</h2>
          <div className="space-y-4 text-base leading-relaxed text-fg/85 md:text-lg">
            {about.gloss && <p className="text-fg">{about.gloss}</p>}
            {about.summary}
          </div>
          {contacts}
          <GlassPillLink href={about.href} onImage>
            {labels.aboutCta}
            <ArrowRight aria-hidden className="size-4" />
          </GlassPillLink>
        </div>
      </div>
      {projects.length > 0 && <Reel projects={projects} workHref={workHref} labels={labels} className="mt-16 md:mt-24" />}
    </section>
  );
}
