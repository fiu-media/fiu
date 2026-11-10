import { cn } from "@/lib/cn";

/*
 * Eased over several stops rather than a straight ramp, which would show as a visible band. 0.82 / 0.5 / 0.2 of the
 * page's ink (`--ink`, #0c0b0d) at 22 / 48 / 74 %.
 */

/**
 * Dissolves the bottom of a full-bleed hero into the page's ink, so there is no hard edge where the photo ends and the
 * content begins (the side rail crosses that edge as the page scrolls). Sits over the photo and under the logo and nav.
 *
 * `bleed`: the box this is placed in already runs 12rem past the hero on phones (Home's photo layer, see
 * HomeScrollLock). The fade is then drawn over that bleed only, so the hero itself, and the colour Safari samples behind
 * its toolbar at rest, stay as they are. Phones only: on desktop Home fades in a mirrored tail below the first screen.
 */
export function HeroFade({ bleed, className }: { bleed?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgb(12_11_13)_0%,rgb(12_11_13/0.82)_22%,rgb(12_11_13/0.5)_48%,rgb(12_11_13/0.2)_74%,rgb(12_11_13/0)_100%)]",
        bleed ? "h-48 md:hidden" : "h-[28dvh]",
        className,
      )}
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
