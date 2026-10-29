"use client";

import { useEffect } from "react";

/** Matches the `max-md:mt-16` runway above Home's <main> (4rem). */
const RUNWAY_PX = 64;

/**
 * Starts Home a few pixels down its (mobile-only) scroll runway. Safari only composites page pixels
 * behind its status bar and toolbar once the document has scrolled, so at scrollY 0 it falls back to a
 * flat colour and the hero photo would stop at the viewport edge.
 */
export function HomeRunway() {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const start = () => {
      if (window.scrollY < RUNWAY_PX) window.scrollTo({ top: RUNWAY_PX, behavior: "instant" });
    };
    start();
    // Client navigation can restore scroll to the top after this effect has run.
    const id = window.requestAnimationFrame(start);
    return () => window.cancelAnimationFrame(id);
  }, []);
  return null;
}
