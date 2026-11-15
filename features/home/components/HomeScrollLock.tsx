"use client";

import { useEffect } from "react";

import { matches } from "@/lib/hooks/useMediaQuery";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { MOBILE } from "@/lib/media";

/** How long the scroll must have been still before the page eases back to the hero. */
const IDLE_MS = 140;

/**
 * Keeps Home on its hero on phones, not up in the photo bleed above it.
 *
 * Safari and Chrome on iOS only draw page pixels behind the notch and the toolbar when the page has content beyond the
 * viewport edges, so the hero carries photo above (the notch's height) and below (a toolbar's worth), and the page
 * rests at the hero (the inline script in pin.ts puts the first paint there). Scrolling up into the bleed is allowed while a finger is on the screen
 * or the page is still moving; this only acts once both have stopped, and then eases back. It never calls scrollTo while
 * a gesture is in progress, which on iOS cancels the gesture and leaves the page stuck or jittering.
 */
export function HomeScrollLock() {
  useEffect(() => {
    if (!matches(MOBILE)) return;
    const heroTop = () => (document.querySelector("[data-hero]")?.getBoundingClientRect().top ?? 0) + window.scrollY;
    let timer = 0;
    let touching = false;
    const settle = () => {
      const top = heroTop();
      if (touching || window.scrollY >= top - 0.5) return;
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "instant" : "smooth" });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, IDLE_MS);
    };
    const onTouchStart = () => {
      touching = true;
      window.clearTimeout(timer);
    };
    const onTouchEnd = () => {
      touching = false;
      schedule();
    };
    // Next may have put the page back at the top (a restored scroll, a language switch) before this mounted.
    if (window.scrollY < heroTop() - 0.5) window.scrollTo({ top: heroTop(), behavior: "instant" });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("pageshow", schedule);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pageshow", schedule);
    };
  }, []);
  return null;
}
