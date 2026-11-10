/**
 * Things that happen once per page load and must survive the hero remounting (a Suspense swap, a client navigation
 * back to `/`, a language switch, which mounts the page tree again).
 */
const flags = { introPlayed: false, splashDismissed: false };

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
