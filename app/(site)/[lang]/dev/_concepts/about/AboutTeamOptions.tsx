import type { ReactNode } from "react";

import { GlassPanel } from "@/components/ui/Glass";
import { AboutHeroSection, AboutLayoutA, type AboutLayoutProps } from "@/features/about";
import { cn } from "@/lib/cn";

import { type DevTeam, PlaceholderTeamPhoto } from "../PlaceholderTeamPhoto";

/** The About props with the team photo required: the sign-off page always has one (the editors', or the stand-in). */
export type AboutTeamProps = Omit<AboutLayoutProps, "team"> & { team: DevTeam };

function Manifesto({
  manifesto,
  attributes,
  className,
}: Pick<AboutTeamProps, "manifesto" | "attributes"> & { className?: string }) {
  return (
    manifesto && (
      <div data-sanity={attributes?.manifesto} className={cn("space-y-6 leading-relaxed text-fg/90", className)}>
        {manifesto}
      </div>
    )
  );
}

function Shell({ props, children }: { props: AboutTeamProps; children: ReactNode }) {
  return (
    <main className="relative text-white">
      <AboutHeroSection still={props.still} slogan={props.slogan} gloss={props.gloss} attributes={props.attributes} />
      {children}
    </main>
  );
}

/**
 * Option 1, "Group portrait": the manifesto first, then the team as one wide framed photo with its caption underneath,
 * before the contact links. Reads as "this is who we are" right after the words.
 */
export function TeamBand(props: AboutTeamProps) {
  const { manifesto, attributes, contacts, team } = props;
  return (
    <Shell props={props}>
      <section className="relative bg-ink px-5 pt-24 pb-24 text-fg md:px-10 md:pt-36 md:pb-36">
        <div className="mx-auto flex max-w-3xl flex-col gap-16">
          <Manifesto manifesto={manifesto} attributes={attributes} className="text-xl md:text-2xl" />
        </div>
        <figure className="mx-auto mt-20 max-w-6xl md:mt-28">
          <PlaceholderTeamPhoto
            team={team}
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="aspect-[4/3] rounded-3xl md:aspect-[21/9]"
          />
          <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-2xl italic">{team.heading}</span>
            {team.caption && <span className="text-sm text-fg-muted">{team.caption}</span>}
          </figcaption>
        </figure>
        <div className="mx-auto mt-20 flex max-w-3xl flex-col gap-14 md:mt-28">{contacts}</div>
      </section>
    </Shell>
  );
}

/**
 * Option 2, "Beside the words": the manifesto and the team photo side by side on desktop (the photo stays in view as
 * you read), the photo first on phones. This is the live About layout, not a copy of it.
 */
export function TeamBeside(props: AboutTeamProps) {
  return <AboutLayoutA {...props} />;
}

/**
 * Option 3, "Second screen": the team gets a full screen of its own, straight after the slogan, with a small
 * clear-glass caption, like a title card. The manifesto and contact links follow on plain dark.
 */
export function TeamScreen(props: AboutTeamProps) {
  const { manifesto, attributes, contacts, team } = props;
  return (
    <Shell props={props}>
      <section className="relative isolate flex h-dvh items-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
        <PlaceholderTeamPhoto team={team} sizes="100vw" className="absolute inset-0 -z-10" />
        <GlassPanel onImage className="max-w-xl p-6 md:p-8">
          <h2 className="font-display text-3xl italic md:text-4xl">{team.heading}</h2>
          {team.caption && <p className="mt-2 text-base text-white/80">{team.caption}</p>}
        </GlassPanel>
      </section>
      <section className="relative bg-ink px-5 py-24 text-fg md:px-10 md:py-36">
        <div className="mx-auto flex max-w-3xl flex-col gap-14">
          <Manifesto manifesto={manifesto} attributes={attributes} className="text-xl md:text-2xl" />
          {contacts}
        </div>
      </section>
    </Shell>
  );
}
