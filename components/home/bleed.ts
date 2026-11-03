/**
 * Matches the `max-md:py-48` bleed around Home's <main> (12rem) and HomeHero's `max-md:-inset-y-48`: taller than the biggest
 * browser toolbar (Comet's is about 155pt).
 */
export const BLEED_PX = 192;

/** Pins the scroll to the middle of the bleed while the HTML is still parsing, so the first paint is already in place. */
export const pinHomeScrollScript = `if(matchMedia("(max-width:767px)").matches)scrollTo(0,${BLEED_PX})`;

/**
 * Moves the scroll by 1px (HomeScrollLock puts it straight back) so Safari samples its status bar and toolbar colour
 * again. Needed when whatever Safari last sampled has just gone, e.g. the fixed splash.
 */
export function nudgeHomeScroll() {
  if (homeIsLocked() && window.matchMedia("(max-width: 767px)").matches) {
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
