"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format } from "@/lib/i18n/format";

/** Past this many projects the ticks would overflow the screen, so only the counter is shown. */
const MAX_TICKS = 24;

/**
 * The overlay that keeps a long full-bleed scroll navigable: a "3 / 12" counter pinned to the top
 * (anything in `children` sits before it) and, on desktop, a column of ticks on the right edge,
 * one per slide, that jump to it.
 *
 * It follows the slides inside the element `containerId` (a FullBleedScroll), so it carries no
 * state of its own beyond which slide is current. Remount it (via `key`) when the slides change.
 */
export function SlideProgress({
  containerId,
  titles,
  label,
  goTo,
  children,
}: {
  containerId: string;
  /** One per slide, in order. */
  titles: string[];
  /** Accessible name of the ticks list. */
  label: string;
  /** "Go to {title}" */
  goTo: string;
  children?: ReactNode;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const slides = document.querySelectorAll<HTMLElement>(`#${containerId} > [aria-roledescription="slide"]`);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent([...slides].indexOf(entry.target as HTMLElement));
        }
      },
      { threshold: 0.5 },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [containerId]);

  function jump(index: number) {
    const slide = document.querySelectorAll(`#${containerId} > [aria-roledescription="slide"]`)[index];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slide?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  const total = titles.length;
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 pt-[max(1.25rem,env(safe-area-inset-top))] max-md:pt-[calc(max(1.25rem,env(safe-area-inset-top))+3.25rem)] md:left-[calc(4rem+env(safe-area-inset-left))]">
        <div className="flex items-center gap-4 px-5 md:px-10">
          <div className="pointer-events-auto -mx-5 min-w-0 flex-1 overflow-x-auto px-5 py-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
            {children}
          </div>
          {total > 1 && (
            <p aria-hidden className="shrink-0 text-sm text-white tabular-nums [text-shadow:0_1px_6px_rgb(0_0_0/0.45)]">
              {current + 1} / {total}
            </p>
          )}
        </div>
      </div>

      {total > 1 && total <= MAX_TICKS && (
        <nav aria-label={label} className="fixed top-1/2 right-3 z-20 hidden -translate-y-1/2 md:block">
          <ul className="flex flex-col">
            {titles.map((title, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-label={format(goTo, { title })}
                  aria-current={i === current ? "true" : undefined}
                  className="group relative flex h-6 w-9 cursor-pointer items-center justify-end rounded-sm pr-1.5"
                >
                  <span
                    aria-hidden
                    className={`h-0.5 rounded-full bg-white shadow-[0_0_6px_rgb(0_0_0/0.5)] transition-[width,opacity] duration-300 motion-reduce:transition-none ${
                      i === current
                        ? "w-6 opacity-100"
                        : "w-3 opacity-45 group-hover:opacity-90 group-focus-visible:opacity-90"
                    }`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-full mr-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity [text-shadow:0_1px_6px_rgb(0_0_0/0.55)] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                  >
                    {title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
