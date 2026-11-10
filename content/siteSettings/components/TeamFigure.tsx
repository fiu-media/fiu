import { SizedImg } from "@/components/ui/SizedImg";
import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/image";

export type Team = {
  image: SizedImage;
  /** e.g. "The team". */
  heading: string;
  /** Who is in the photo, where, when. Optional. */
  caption: string | null;
};

/** The team photo, filling its box. The caller sets the shape (aspect ratio, radius). */
export function TeamPhoto({ team, sizes, className }: { team: Team; sizes: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <SizedImg image={team.image} sizes={sizes} className="size-full" />
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
