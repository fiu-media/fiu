import { MOBILE } from "@/lib/media";

/** Where the hero starts in the document: the top bleed (`--bleed`, see Home's page). */
export const HERO_TOP = `(document.querySelector("[data-hero]").getBoundingClientRect().top+scrollY)`;

/**
 * Puts the scroll at the hero (the bottom of the top bleed) while the HTML is still parsing — placed in the page right
 * after the bleed hero, so the document is already tall enough and the first paint is already in place. Home can be
 * scrolled down from there to its fold; scrolling up into the bleed eases back (HomeScrollLock).
 */
export const pinHomeScrollScript = `if(matchMedia(${JSON.stringify(MOBILE)}).matches)scrollTo(0,${HERO_TOP})`;
