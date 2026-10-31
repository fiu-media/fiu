import type { ReactNode } from "react";

/**
 * A run of full-screen slides that snap into place as the page scrolls (Our Work, a talent's
 * work). The page itself scrolls, so the rail and phone menu bar behave as everywhere else; the
 * `data-snap` marker is what switches scroll snapping on for the document (see globals.css).
 *
 * Content above the first slide can stay in the same scroll: give it `snap-start` too, or the
 * browser would snap straight past it.
 */
export function FullBleedScroll({ label, id, children }: { label: string; id?: string; children: ReactNode }) {
  return (
    <div id={id} role="region" aria-label={label} data-snap="mandatory">
      {children}
    </div>
  );
}

/** One screen of a FullBleedScroll. Put full-bleed media inside and a caption at the bottom. */
export function FullBleedSlide({
  label,
  className = "",
  children,
}: {
  /** Accessible name, e.g. "Solas, 2 of 5". */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-roledescription="slide"
      aria-label={label}
      className={`relative isolate h-dvh snap-start snap-always overflow-hidden bg-ink text-white ${className}`}
    >
      {children}
    </section>
  );
}
