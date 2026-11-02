"use client";

import { useEffect, useLayoutEffect } from "react";
import { BLEED_PX, nudgeHomeScroll } from "./bleed";

/**
 * Pins Home in the middle of a document that is taller than the screen (mobile only).
 *
 * Safari only shows page pixels behind its status bar and toolbar when the page has content beyond the
 * viewport edges, so Home carries BLEED_PX of photo above and below. Touch scrolling is switched off in
 * CSS (touch-action, keyed on `html[data-home-lock]`, see globals.css); this keeps the scroll position at the
 * middle regardless, e.g. after Next.js restores the scroll to the top or the toolbar changes the viewport height.
 *
 * The flag lives on <html> and is set from an effect, not from Home's markup: Next keeps the previous route
 * mounted but hidden (Activity), so a marker in Home's DOM would outlive the page and lock every page after it.
 * Effect cleanups run when Home is hidden, which is what removes the flag.
 *
 * The inline script (bleed.ts) already pins the scroll before first paint, so no scroll event follows and Safari can keep
 * the bar colour it sampled while the photo was still loading. Nudging the scroll once the first photo and then the page
 * have loaded (and when the splash goes, see Splash) makes it sample again; the `scroll` listener below puts the position
 * straight back.
 */
export function HomeScrollLock() {
  useLayoutEffect(() => {
    document.documentElement.dataset.homeLock = "";
    return () => {
      delete document.documentElement.dataset.homeLock;
    };
  }, []);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const pin = () => {
      if (Math.abs(window.scrollY - BLEED_PX) > 0.5) window.scrollTo({ top: BLEED_PX, behavior: "instant" });
    };
    const nudge = nudgeHomeScroll;
    const onImageLoad = (event: Event) => {
      if (!(event.target instanceof HTMLImageElement) || !event.target.closest("[data-home-bleed]")) return;
      document.removeEventListener("load", onImageLoad, true);
      nudge();
    };
    pin();
    const id = window.requestAnimationFrame(() => {
      pin();
      // The photo may already be in by the time this runs (cached, fast connection).
      if (document.querySelector<HTMLImageElement>("[data-home-bleed] img")?.complete) nudge();
    });
    // Image `load` events don't bubble, so listen in the capture phase.
    document.addEventListener("load", onImageLoad, true);
    if (document.readyState !== "complete") window.addEventListener("load", nudge, { once: true });
    window.addEventListener("scroll", pin, { passive: true });
    window.addEventListener("resize", pin);
    window.addEventListener("pageshow", pin);
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener("load", onImageLoad, true);
      window.removeEventListener("load", nudge);
      window.removeEventListener("scroll", pin);
      window.removeEventListener("resize", pin);
      window.removeEventListener("pageshow", pin);
    };
  }, []);
  return null;
}
