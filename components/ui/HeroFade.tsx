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
 *
 * It sits under the hero's bottom scrim (75% black, `from-scrim/75` in AboutLayout), so its end colour is `--ink`
 * divided by 0.25: after that scrim it lands exactly on the sheet's ink. Change the scrim and this 0.25 (1 - 0.75)
 * together, or a seam shows at the top of the sheet.
 */
export function SheetFade({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-full h-[28dvh] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--sheet-ink)_0%,transparent)_0%,color-mix(in_srgb,var(--sheet-ink)_20%,transparent)_26%,color-mix(in_srgb,var(--sheet-ink)_50%,transparent)_52%,color-mix(in_srgb,var(--sheet-ink)_82%,transparent)_78%,var(--sheet-ink)_100%)] [--sheet-ink:rgb(from_var(--ink)_calc(r/0.25)_calc(g/0.25)_calc(b/0.25))]",
        className,
      )}
    />
  );
}
