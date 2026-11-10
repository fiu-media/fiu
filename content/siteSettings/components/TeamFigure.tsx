import Image from "next/image";

import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/image";

export type Team = {
  image: SizedImage;
  /** e.g. "The team". */
  heading: string;
  /** Who is in the photo, where, when. Optional. */
  caption: string | null;
  /** Marks the photo as a stand-in on a sign-off page; leave out on the real pages. */
  placeholder?: boolean;
};

/** The team photo, filling its box. The caller sets the shape (aspect ratio, radius). */
export function TeamPhoto({ team, sizes, className }: { team: Team; sizes: string; className?: string }) {
  const { image } = team;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.alt}
        sizes={sizes}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        style={{ objectPosition: image.position }}
        className="size-full object-cover"
      />
      {team.placeholder && (
        <span className="absolute top-3 left-3 rounded-full bg-scrim/60 px-3 py-1 text-xs font-medium tracking-[0.1em] text-on-image uppercase">
          Placeholder
        </span>
      )}
    </div>
  );
}

/**
 * The team photo as About and Home both show it: 4:3 on phones and a 4:5 portrait frame from `md`, with the heading
 * and caption stacked underneath. One component, so the two pages can't drift apart.
 */
export function TeamFigure({
  team,
  attribute,
  className,
}: {
  team: Team;
  /** `data-sanity` value that makes the photo clickable in the Presentation tool. */
  attribute?: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div data-sanity={attribute}>
        <TeamPhoto team={team} sizes="(min-width: 768px) 40vw, 100vw" className="aspect-[4/3] rounded-3xl md:aspect-[4/5]" />
      </div>
      <figcaption className="mt-4">
        <span className="font-display text-2xl italic">{team.heading}</span>
        {team.caption && <span className="mt-1 block text-sm text-fg-muted">{team.caption}</span>}
      </figcaption>
    </figure>
  );
}
