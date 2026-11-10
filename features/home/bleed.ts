import { matches } from "@/lib/hooks/useMediaQuery";
import { MOBILE } from "@/lib/media";

import { BLEED_PX } from "./pin";

export { BLEED_PX };

/**
 * Moves the scroll by 1px (HomeScrollLock puts it straight back) so Safari samples its status bar and toolbar colour
 * again. Needed when whatever Safari last sampled has just gone, e.g. the fixed splash. Only while the hero is on
 * screen: down at the fold it would pull the reader back up.
 */
export function nudgeHomeScroll() {
  if (homeIsLocked() && matches(MOBILE) && Math.abs(window.scrollY - BLEED_PX) <= 1) {
    window.scrollTo({ top: BLEED_PX - 1, behavior: "instant" });
  }
}

/**
 * Whether Home is the page on screen. HomeScrollLock sets the flag in a layout effect and removes it as soon as Home is
 * hidden, which is before Next scrolls the next page to the top. Pinning or nudging after that would fight the navigation.
 */
export function homeIsLocked() {
  return document.documentElement.hasAttribute("data-home-lock");
}

/** Nudges now and twice more over the next 300 ms, for when a single nudge lands before Safari has painted the change. */
export function nudgeHomeScrollRepeatedly() {
  nudgeHomeScroll();
  for (const delay of [120, 300]) window.setTimeout(nudgeHomeScroll, delay);
}
