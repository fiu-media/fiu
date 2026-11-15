import { matches } from "@/lib/hooks/useMediaQuery";
import { MOBILE } from "@/lib/media";

import { BLEED_PX } from "./bleedPx";

export { BLEED_PX };

/** True while a nudge cycle owns the scroll, so the pin listener doesn't fight the intentional 1px move. */
let nudgeInFlight = false;

/**
 * Holds Home's scroll at the hero (BLEED_PX) or below. Above that is only bleed photo for Safari's bars.
 * No-op during an in-flight nudge: that cycle restores itself.
 */
export function pinHomeScroll() {
  if (nudgeInFlight || !homeIsLocked()) return;
  if (window.scrollY < BLEED_PX - 0.5) {
    window.scrollTo({ top: BLEED_PX, behavior: "instant" });
  }
}

/**
 * Moves the scroll by 1px then restores it so Safari samples its status bar and toolbar colour
 * again. Needed when whatever Safari last sampled has just gone, e.g. the fixed splash. Only while
 * the hero is on screen: down at the fold it would pull the reader back up.
 *
 * The restore is done here (not by racing the pin listener) so concurrent callers — splash fade,
 * image load, menu close — collapse into one cycle instead of stacking 1px jitters.
 */
export function nudgeHomeScroll() {
  runNudge();
}

/** Nudges now and twice more over the next 300 ms, for when a single nudge lands before Safari has painted the change. */
export function nudgeHomeScrollRepeatedly() {
  runNudge();
  for (const delay of [120, 300]) window.setTimeout(runNudge, delay);
}

function runNudge() {
  if (nudgeInFlight || !homeIsLocked() || !matches(MOBILE)) return;
  if (Math.abs(window.scrollY - BLEED_PX) > 1) return;
  nudgeInFlight = true;
  window.scrollTo({ top: BLEED_PX - 1, behavior: "instant" });
  requestAnimationFrame(() => {
    window.scrollTo({ top: BLEED_PX, behavior: "instant" });
    requestAnimationFrame(() => {
      nudgeInFlight = false;
    });
  });
}

/**
 * Whether Home is the page on screen. HomeScrollLock sets the flag in a layout effect and removes it as soon as Home is
 * hidden, which is before Next scrolls the next page to the top. Pinning or nudging after that would fight the navigation.
 */
export function homeIsLocked() {
  return document.documentElement.hasAttribute("data-home-lock");
}
