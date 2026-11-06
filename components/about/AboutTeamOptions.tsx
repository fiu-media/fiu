import Image from "next/image";
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/rentals";
import { AboutHeroSection, type AboutLayoutProps } from "./AboutLayouts";

export type AboutTeamProps = AboutLayoutProps & {
  /** The team photo (a placeholder until the editors upload one). */
  team: SizedImage;
  caption: string;
  /** Title for the team section, e.g. "The team". */
  heading: string;
  /** Marks the photo as a stand-in on the sign-off page; leave out for the real one. */
  placeholder?: boolean;
};

function TeamPhoto({
  team,
  sizes,
  className,
  placeholder,
}: Pick<AboutTeamProps, "team" | "placeholder"> & { sizes: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={team.src}
        width={team.width}
        height={team.height}
        alt={team.alt}
        sizes={sizes}
        placeholder={team.blurDataURL ? "blur" : "empty"}
        blurDataURL={team.blurDataURL}
        style={{ objectPosition: team.position }}
        className="size-full object-cover"
      />
      {placeholder && (
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-[0.1em] text-white uppercase">
          Placeholder
        </span>
      )}
    </div>
  );
}

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
  const { manifesto, attributes, contacts, footer, team, caption, heading, placeholder } = props;
  return (
    <Shell props={props}>
      <section className="relative bg-ink px-5 pt-24 pb-24 text-fg md:px-10 md:pt-36 md:pb-36">
        <div className="mx-auto flex max-w-3xl flex-col gap-16">
          <Manifesto manifesto={manifesto} attributes={attributes} className="text-xl md:text-2xl" />
        </div>
        <figure className="mx-auto mt-20 max-w-6xl md:mt-28">
          <TeamPhoto
            team={team}
            placeholder={placeholder}
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="aspect-[4/3] rounded-3xl md:aspect-[21/9]"
          />
          <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-2xl italic">{heading}</span>
            <span className="text-sm text-fg-muted">{caption}</span>
          </figcaption>
        </figure>
        <div className="mx-auto mt-20 flex max-w-3xl flex-col gap-14 md:mt-28">
          {contacts}
          {footer}
        </div>
      </section>
    </Shell>
  );
}

/**
 * Option 2, "Beside the words": the manifesto and the team photo side by side on desktop (the photo stays in view as
 * you read), the photo first on phones.
 */
export function TeamBeside(props: AboutTeamProps) {
  const { manifesto, attributes, contacts, footer, team, caption, heading, placeholder } = props;
  return (
    <Shell props={props}>
      <section className="relative bg-ink px-5 py-24 text-fg md:px-10 md:py-36">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20">
          <figure className="md:sticky md:top-16 md:self-start">
            <TeamPhoto
              team={team}
              placeholder={placeholder}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="aspect-[4/3] rounded-3xl md:aspect-[4/5]"
            />
            <figcaption className="mt-4">
              <span className="font-display text-2xl italic">{heading}</span>
              <span className="mt-1 block text-sm text-fg-muted">{caption}</span>
            </figcaption>
          </figure>
          <div className="flex flex-col gap-14">
            <Manifesto manifesto={manifesto} attributes={attributes} className="text-xl md:text-2xl" />
            {contacts}
            {footer}
          </div>
        </div>
      </section>
    </Shell>
  );
}

/**
 * Option 3, "Second screen": the team gets a full screen of its own, straight after the slogan, with a small
 * clear-glass caption, like a title card. The manifesto and contact links follow on plain dark.
 */
export function TeamScreen(props: AboutTeamProps) {
  const { manifesto, attributes, contacts, footer, team, caption, heading, placeholder } = props;
  return (
    <Shell props={props}>
      <section className="relative isolate flex h-dvh items-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
        <TeamPhoto team={team} placeholder={placeholder} sizes="100vw" className="absolute inset-0 -z-10" />
        <GlassPanel onImage className="max-w-xl p-6 md:p-8">
          <h2 className="font-display text-3xl italic md:text-4xl">{heading}</h2>
          <p className="mt-2 text-base text-white/80">{caption}</p>
        </GlassPanel>
      </section>
      <section className="relative bg-ink px-5 py-24 text-fg md:px-10 md:py-36">
        <div className="mx-auto flex max-w-3xl flex-col gap-14">
          <Manifesto manifesto={manifesto} attributes={attributes} className="text-xl md:text-2xl" />
          {contacts}
          {footer}
        </div>
      </section>
    </Shell>
  );
}
