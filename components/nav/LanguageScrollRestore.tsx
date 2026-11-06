"use client";

import { useLayoutEffect } from "react";
import { takeCarriedScroll } from "./languageScroll";

/** The page may still be streaming in, so wait this many frames for it to grow tall enough before giving up. */
const MAX_FRAMES = 60;

/**
 * Puts the page back where the visitor was after a language switch (see languageScroll.ts). Mounted with the nav, so it
 * lives in the new page tree.
 */
export function LanguageScrollRestore({ pathname }: { pathname: string }) {
  useLayoutEffect(() => {
    const y = takeCarriedScroll(pathname);
    if (y === null) return;
    let frame = 0;
    let id = 0;
    const apply = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.min(y, Math.max(max, 0)), behavior: "instant" });
      // Reached, or the page has stopped growing: done. Otherwise try again once more of it has arrived.
      if (max >= y || ++frame >= MAX_FRAMES) return;
      id = window.requestAnimationFrame(apply);
    };
    apply();
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}
