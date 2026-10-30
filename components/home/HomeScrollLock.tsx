"use client";

import { useEffect } from "react";

/** Matches the `max-md:py-48` bleed around Home's <main> (12rem): taller than the biggest browser toolbar (Comet's is about 155pt). */
const BLEED_PX = 192;

/**
 * Pins Home in the middle of a document that is taller than the screen (mobile only).
 *
 * Safari only shows page pixels behind its status bar and toolbar when the page has content beyond the
 * viewport edges, so Home carries BLEED_PX of photo above and below. Touch scrolling is switched off in
 * CSS (touch-action, see globals.css); this keeps the scroll position at the middle regardless, e.g.
 * after Next.js restores the scroll to the top or the toolbar changes the viewport height.
 */
export function HomeScrollLock() {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const pin = () => {
      if (Math.abs(window.scrollY - BLEED_PX) > 0.5) window.scrollTo({ top: BLEED_PX, behavior: "instant" });
    };
    pin();
    const id = window.requestAnimationFrame(pin);
    window.addEventListener("scroll", pin, { passive: true });
    window.addEventListener("resize", pin);
    window.addEventListener("pageshow", pin);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("scroll", pin);
      window.removeEventListener("resize", pin);
      window.removeEventListener("pageshow", pin);
    };
  }, []);
  return null;
}
