import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";

import { SizedImg } from "@/components/ui/SizedImg";
import { type Team, TeamFigure } from "@/content/siteSettings";
import { SheetFade } from "@/features/home/components/HeroFade";
import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/image";

export type AboutLayoutProps = {
  still: SizedImage;
  slogan: string | null;
  gloss: string | null;
  manifesto: ReactNode;
  contacts: ReactNode;
  /** The team photo. Only Option A shows it (beside the manifesto); the sign-off options B to F ignore it. */
  team?: Team;
  /** `data-sanity` values that make the parts clickable in the Presentation tool. */
  attributes?: { still?: string; slogan?: string; manifesto?: string; team?: string };
};

export function Still({ still, attribute, className }: { still: SizedImage; attribute?: string; className?: string }) {
  return <SizedImg image={still} sizes="100vw" priority data-sanity={attribute} className={cn("size-full", className)} />;
}

/** The first screen of Option A: the still with the slogan large over it. */
export function AboutHeroSection({
  still,
  slogan,
  gloss,
  attributes,
}: Pick<AboutLayoutProps, "still" | "slogan" | "gloss" | "attributes">) {
  return (
    <>
      <div className="sticky top-0 -z-10 h-dvh">
        <Still still={still} attribute={attributes?.still} />
      </div>

      <section className="relative -mt-[100dvh] flex h-dvh flex-col justify-end bg-gradient-to-t from-black/75 via-black/20 to-black/35 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
        <h1
          data-sanity={attributes?.slogan}
          className="max-w-5xl font-display text-5xl leading-[1.02] text-balance italic md:text-8xl"
        >
          {slogan}
        </h1>
        {gloss && <p className="mt-4 max-w-xl text-base text-white/80 md:text-lg">{gloss}</p>}
        <ArrowDown aria-hidden className="mt-8 size-5 text-white/60" />
      </section>
    </>
  );
}

/**
 * Option A, "Slogan first": the still holds the first screen with the slogan large over it. The
 * manifesto and contact links follow on plain dark, so no running text sits over the photo. With a team photo
 * it sits beside the manifesto (above it on phones), in the same frame Home's fold uses.
 */
export function AboutLayoutA({ still, slogan, gloss, manifesto, contacts, team, attributes }: AboutLayoutProps) {
  const body = (
    <>
      {manifesto && (
        <div data-sanity={attributes?.manifesto} className="space-y-6 text-xl leading-relaxed text-fg/90 md:text-2xl">
          {manifesto}
        </div>
      )}
      {contacts}
    </>
  );
  return (
    <main className="relative text-white">
      <AboutHeroSection still={still} slogan={slogan} gloss={gloss} attributes={attributes} />

      {/* Plain dark from here, so the surface's colours rather than the white kept for text over the photo. */}
      <section className="relative bg-ink px-5 py-24 text-fg md:px-10 md:py-36">
        {/* Behind the slogan above it, in front of the photo: the sheet's top edge arrives as a fade. */}
        <SheetFade className="-z-10" />
        {team ? (
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20">
            <TeamFigure team={team} attribute={attributes?.team} className="md:sticky md:top-16 md:self-start" />
            <div className="flex flex-col gap-14">{body}</div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-14">{body}</div>
        )}
      </section>
    </main>
  );
}
