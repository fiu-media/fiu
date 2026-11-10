/** The media query for a screen taller than it is wide, which is when phones get their portrait stills. */
export const PORTRAIT = "(orientation: portrait)";
/** The opposite of `PORTRAIT`: every screen is one or the other. */
export const LANDSCAPE = "(orientation: landscape)";
/** Phones and anything narrower than Tailwind's `md` (48rem). Same break as `max-md:`. */
export const MOBILE = "(max-width: 767px)";
/** From Tailwind's `md` up, which is when the nav becomes the side rail. The opposite of `MOBILE`. */
export const DESKTOP = "(min-width: 48rem)";
/** A touch screen: the main pointer is imprecise (a finger), not a mouse. */
export const COARSE_POINTER = "(pointer: coarse)";
/** A touch device held upright. */
export const UPRIGHT_TOUCH = `${COARSE_POINTER} and ${PORTRAIT}`;
/** The media query for a visitor who asked the system to cut back on animation. */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
