/** The media query for a screen taller than it is wide, which is when phones get their portrait stills. */
export const PORTRAIT = "(orientation: portrait)";
/** The opposite of `PORTRAIT`: every screen is one or the other. */
export const LANDSCAPE = "(orientation: landscape)";
/** Phones and anything narrower than Tailwind's `md` (48rem): Home's phone-only scroll pin. The nav's own break is `DESKTOP`. */
export const MOBILE = "(max-width: 767px)";
/**
 * Wide and tall enough for the side rail, which is when the nav is the rail; otherwise it is the phone bar and menu. The
 * same break as the `rail:` and `no-rail:` variants (globals.css). Short is 40rem and under: the rail's labels, in Irish,
 * need about 620px.
 */
export const DESKTOP = "(min-width: 48rem) and (min-height: 40rem)";
/** A touch screen: the main pointer is imprecise (a finger), not a mouse. */
export const COARSE_POINTER = "(pointer: coarse)";
/** A touch device held upright. */
export const UPRIGHT_TOUCH = `${COARSE_POINTER} and ${PORTRAIT}`;
/** The media query for a visitor who asked the system to cut back on animation. */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
