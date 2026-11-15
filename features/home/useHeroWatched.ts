"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * Whether anyone can see the hero: the tab is showing and some of `hero` is in the viewport. The stills only move on
 * while it is true, so a visitor reading the fold, or with the site in a background tab, isn't paying for crossfades
 * (and the glass logo's frames that go with them) that nobody sees. True until measured, which is the first screen.
 */
export function useHeroWatched(hero: RefObject<Element | null>): boolean {
  const [watched, setWatched] = useState(true);
  useEffect(() => {
    const element = hero.current;
    if (!element) return;
    let inView = true;
    const update = () => setWatched(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [hero]);
  return watched;
}
