import { cn } from "@/lib/cn";

/*
 * Eased over several stops rather than a straight ramp, which would show as a visible band. 0.82 / 0.5 / 0.2 of the
 * page's ink (`--ink`) at 22 / 48 / 74 %.
 */

/**
 * Dissolves the bottom of a full-bleed hero into the page's ink, so there is no hard edge where the photo ends and the
 * content begins (the side rail crosses that edge as the page scrolls). Sits over the photo and under the logo and nav.
 *
 * `bleed`: the box this is placed in already runs `--bleed` past the hero on phones (Home's photo layer). The fade is then drawn over the bleed below only, so the hero itself, and the colour Safari samples behind
 * its toolbar at rest, stay as they are. Phones only: on desktop Home fades in a mirrored tail below the first screen.
 */
export function HeroFade({ bleed, className }: { bleed?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,var(--ink)_0%,color-mix(in_srgb,var(--ink)_82%,transparent)_22%,color-mix(in_srgb,var(--ink)_50%,transparent)_48%,color-mix(in_srgb,var(--ink)_20%,transparent)_74%,transparent_100%)]",
        bleed ? "h-(--bleed) md:hidden" : "h-[28dvh]",
        className,
      )}
    />
  );
}

/**
 * Darkens the bleed above Home's hero on phones, the same 60% black the nav's scrim starts at over the hero itself
 * (SiteNavClient), so the two meet without a seam. The bleed is raw photo; without this the notch, which shows it
 * whenever the scroll is above the hero, comes out brighter than the hero's top. Under the logo layers.
 */
export function HeroTopScrim({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-(--bleed) bg-scrim/60 md:hidden", className)}
    />
  );
}

/**
 * The same dissolve for a sheet that slides up over a sticky photo (About): placed in the sheet, it rises above the
 * sheet's top edge, so the edge arrives as a soft fade instead of a hard line.
 */
export function SheetFade({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-full h-[28dvh] bg-[linear-gradient(to_bottom,rgb(48_44_52/0)_0%,rgb(48_44_52/0.2)_26%,rgb(48_44_52/0.5)_52%,rgb(48_44_52/0.82)_78%,rgb(48_44_52)_100%)]",
        className,
      )}
    />
  );
}
