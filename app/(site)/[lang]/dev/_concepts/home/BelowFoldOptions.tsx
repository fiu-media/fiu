import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TeamPhoto } from "@/content/siteSettings";
import { FullBleedScroll, FullBleedSlide } from "@/components/ui/FullBleedScroll";
import { GlassPillLink } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { gutter, HomeFold, Photo, Reel, type FoldProject, type FoldProps } from "@/features/home";
export type { FoldProject, FoldProps };

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.14em] text-white/60 uppercase">{children}</p>;
}

/** A text link that ends in an arrow, for tiles that are themselves one big link (so can't hold a pill). */
function ArrowLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold">
      {children}
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1"
      />
    </span>
  );
}

/** The About lead of the reel options: the slogan, then the gloss and one paragraph, with an optional "About us" pill. */
function ReelLead({ about, labels, cta = true }: Pick<FoldProps, "about" | "labels"> & { cta?: boolean }) {
  return (
    <div className={cn("mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-16", gutter)}>
      <h2 className="font-display text-4xl leading-[1.05] text-balance italic md:text-6xl">{about.slogan}</h2>
      <div className="flex flex-col items-start gap-6">
        <div className="space-y-4 text-base leading-relaxed text-white/80 md:text-lg">
          {about.gloss && <p className="text-white">{about.gloss}</p>}
          {about.summary}
        </div>
        {cta && (
          <GlassPillLink href={about.href} onImage>
            {labels.aboutCta}
            <ArrowRight aria-hidden className="size-4" />
          </GlassPillLink>
        )}
      </div>
    </div>
  );
}

/**
 * Option A, "Reel strip": a slim About lead, then a row of project covers you swipe or scroll sideways, ending in
 * "All work". Image-led; About stays quiet. Has no room for the team photo or the contact links.
 */
export function FoldReelStrip({ about, projects, workHref, labels }: FoldProps) {
  return (
    <section className="bg-ink py-20 text-white md:py-28">
      <ReelLead about={about} labels={labels} />
      <Reel projects={projects} workHref={workHref} labels={labels} className="mt-16 md:mt-24" />
    </section>
  );
}

/**
 * Option E, "Team in the reel": the team is one more card in the strip, after the projects and in the same frame, and
 * the email and Instagram links sit in a line under the strip.
 */
export function FoldReelTeamCard({ about, team, contacts, projects, workHref, labels }: FoldProps) {
  return (
    <section className="bg-ink pt-20 pb-16 text-white md:pt-28 md:pb-20">
      <ReelLead about={about} labels={labels} />
      <Reel projects={projects} workHref={workHref} labels={labels} className="mt-16 md:mt-24">
        <Link href={about.href} className="group w-[78vw] shrink-0 snap-start md:w-[30rem]">
          <TeamPhoto
            team={team}
            sizes="(min-width: 768px) 30rem, 78vw"
            className="aspect-[4/5] rounded-2xl md:aspect-[4/3] [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-out group-hover:[&_img]:scale-[1.03]"
          />
          <h3 className="mt-4 font-display text-2xl italic md:text-3xl">{team.heading}</h3>
          {team.caption && <p className="mt-1 text-sm text-white/60">{team.caption}</p>}
        </Link>
      </Reel>
      <div className={cn("mx-auto mt-10 max-w-6xl border-t border-line pt-8 md:mt-14", gutter)}>{contacts}</div>
    </section>
  );
}

/**
 * Option F, "Team lead": the one that shipped. It is `HomeFold`, which Home renders; kept here so the sign-off page
 * still shows it next to the others.
 */
export const FoldReelTeamLead = (props: FoldProps) => <HomeFold {...props} />;

/**
 * Option G, "Closing band": the lead and the strip exactly as in A, then the section ends with the team photo beside
 * a "say hello" block: email, Instagram and the About link. The page closes on the people.
 */
export function FoldReelClosing({ about, team, contacts, projects, workHref, labels }: FoldProps) {
  return (
    <section className="bg-ink pt-20 text-white md:pt-28">
      <ReelLead about={about} labels={labels} cta={false} />
      <Reel projects={projects} workHref={workHref} labels={labels} className="mt-16 md:mt-24" />
      <div
        className={cn(
          "mx-auto mt-16 grid max-w-6xl items-center gap-8 border-t border-line py-16 md:mt-24 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-16 md:py-24",
          gutter,
        )}
      >
        <TeamPhoto team={team} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[3/2] rounded-3xl" />
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-medium tracking-[0.14em] text-white/60 uppercase">{team.heading}</p>
          {team.caption && <p className="text-base text-white/70">{team.caption}</p>}
          {contacts}
          <GlassPillLink href={about.href} onImage>
            {labels.aboutCta}
            <ArrowRight aria-hidden className="size-4" />
          </GlassPillLink>
        </div>
      </div>
    </section>
  );
}

/**
 * Option B, "Statement + index": the slogan and one paragraph on the left, the work as a numbered list of titles on
 * the right. On desktop a thumbnail opens in a row as you point at it; on touch each row carries a small one.
 */
export function FoldIndex({ about, projects, workHref, labels }: FoldProps) {
  return (
    <section className={cn("bg-ink py-20 text-white md:py-32", gutter)}>
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20">
        <div className="flex flex-col items-start gap-6 md:sticky md:top-24 md:self-start">
          <h2 className="font-display text-4xl leading-[1.05] text-balance italic md:text-6xl">{about.slogan}</h2>
          <div className="space-y-4 text-base leading-relaxed text-white/80 md:text-lg">
            {about.gloss && <p className="text-white">{about.gloss}</p>}
            {about.summary}
          </div>
          <GlassPillLink href={about.href} onImage>
            {labels.aboutCta}
            <ArrowRight aria-hidden className="size-4" />
          </GlassPillLink>
        </div>

        <div>
          <Eyebrow>{labels.work}</Eyebrow>
          <ol className="mt-4 border-t border-line">
            {projects.map((project, i) => (
              <li key={project.id} className="border-b border-line">
                <Link href={project.href} className="group flex items-center gap-4 py-5 md:gap-6 md:py-6">
                  <span aria-hidden className="w-7 text-sm text-white/40 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl md:text-4xl">{project.title}</span>
                    <span className="mt-1 block text-sm text-white/60">{project.meta}</span>
                  </span>
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-[width,opacity] duration-500 ease-out md:w-0 md:opacity-0 md:group-hover:w-32 md:group-hover:opacity-100 md:group-focus-visible:w-32 md:group-focus-visible:opacity-100">
                    <Photo image={project.image} sizes="8rem" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <GlassPillLink href={workHref} onImage>
              {labels.workCta}
              <ArrowRight aria-hidden className="size-4" />
            </GlassPillLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Option C, "Two doors": one screen split in two, About on one side and a featured project on the other. Each half
 * is a single large link; they stack on phones.
 */
export function FoldTwoDoors({ about, projects, labels }: FoldProps) {
  const featured = projects[0];
  return (
    <section className="grid bg-ink text-white md:min-h-dvh md:grid-cols-2">
      <Link
        href={about.href}
        className="group relative isolate flex min-h-[85dvh] flex-col justify-end overflow-hidden p-5 md:min-h-0 md:p-10"
      >
        <div className="absolute inset-0 -z-10">
          <Photo
            image={about.still}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
        </div>
        <Eyebrow>{labels.about}</Eyebrow>
        <h2 className="mt-3 max-w-xl font-display text-4xl leading-[1.05] text-balance italic md:text-5xl">{about.slogan}</h2>
        <div className="mt-4 max-w-md text-base leading-relaxed text-white/85">{about.summary}</div>
        <div className="mt-6">
          <ArrowLabel>{labels.aboutCta}</ArrowLabel>
        </div>
      </Link>

      {featured && (
        <Link
          href={featured.href}
          className="group relative isolate flex min-h-[85dvh] flex-col justify-end overflow-hidden p-5 md:min-h-0 md:p-10"
        >
          <div className="absolute inset-0 -z-10">
            <Photo
              image={featured.image}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />
          </div>
          <Eyebrow>{labels.work}</Eyebrow>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] md:text-6xl">{featured.title}</h2>
          <p className="mt-2 text-sm text-white/70">{featured.meta}</p>
          <div className="mt-6">
            <ArrowLabel>{labels.workCta}</ArrowLabel>
          </div>
        </Link>
      )}
    </section>
  );
}

/**
 * Option D, "Snap sequel": keeps the hero's one-screen-at-a-time rhythm with the same full-bleed slides as Our Work.
 * One slide for About, one for a featured project.
 */
export function FoldSnapSequel({ about, projects, workHref, labels }: FoldProps) {
  const featured = projects[0];
  return (
    <FullBleedScroll label={labels.about}>
      <FullBleedSlide label={labels.about}>
        <Photo image={about.still} sizes="100vw" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
          <Eyebrow>{labels.about}</Eyebrow>
          <h2 className="mt-3 max-w-5xl font-display text-5xl leading-[1.02] text-balance italic md:text-8xl">{about.slogan}</h2>
          <div className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{about.summary}</div>
          <div className="mt-6">
            <GlassPillLink href={about.href} onImage>
              {labels.aboutCta}
              <ArrowRight aria-hidden className="size-4" />
            </GlassPillLink>
          </div>
        </div>
      </FullBleedSlide>

      {featured && (
        <FullBleedSlide label={labels.work}>
          <Photo image={featured.image} sizes="100vw" className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
            <Eyebrow>{labels.work}</Eyebrow>
            <h2 className="mt-3 font-display text-5xl leading-[1.02] md:text-7xl">{featured.title}</h2>
            <p className="mt-2 text-sm text-white/70">{featured.meta}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <GlassPillLink href={featured.href} onImage>
                {labels.view}
              </GlassPillLink>
              <GlassPillLink href={workHref} onImage>
                {labels.workCta}
                <ArrowRight aria-hidden className="size-4" />
              </GlassPillLink>
            </div>
          </div>
        </FullBleedSlide>
      )}
    </FullBleedScroll>
  );
}
