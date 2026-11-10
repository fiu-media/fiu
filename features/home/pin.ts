import { MOBILE } from "@/lib/media";

// Apart from bleed.ts because the Home page (a Server Component) imports the script, and bleed.ts reaches the
// client-only media hooks.

/**
 * Matches the `max-md:py-48` bleed around Home's hero (12rem) and HomeHero's `max-md:-inset-y-48`: taller than the biggest
 * browser toolbar (Comet's is about 155pt).
 */
export const BLEED_PX = 192;

/**
 * Puts the scroll at the hero (the bottom of the top bleed) while the HTML is still parsing, so the first paint is already
 * in place. Home can be scrolled down from there to its fold, but not up into the bleed.
 */
export const pinHomeScrollScript = `if(matchMedia(${JSON.stringify(MOBILE)}).matches)scrollTo(0,${BLEED_PX})`;
