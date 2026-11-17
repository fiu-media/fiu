/**
 * Things that happen once per page load and must survive the hero remounting (a Suspense swap, a client navigation
 * back to `/`, a language switch, which mounts the page tree again).
 */
const flags = { introPlayed: false, splashDismissed: false, still: null as string | null, paused: false };

/** The intro has played out. A hero mounted after that shows the logo at rest, not spinning in from the middle again. */
export const hasIntroPlayed = () => flags.introPlayed;
export const markIntroPlayed = () => {
  flags.introPlayed = true;
};

/** The splash has lifted. If the hero remounts, the splash must not replay. */
export const isSplashDismissed = () => flags.splashDismissed;
export const markSplashDismissed = () => {
  flags.splashDismissed = true;
};

/** The still on show (its `src`), so a hero that mounts again, in another language, opens on the same one. */
export const getStill = () => flags.still;
export const setStill = (src: string) => {
  flags.still = src;
};

/** The visitor paused the stills (the hero's pause button), so a hero that mounts again, in another language, stays paused. */
export const isPaused = () => flags.paused;
export const setPaused = (paused: boolean) => {
  flags.paused = paused;
};
