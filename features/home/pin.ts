import { BLEED_PX } from "@/lib/bleedPx";
import { MOBILE } from "@/lib/media";

// Apart from lib/homeScroll.ts because the Home page (a Server Component) imports the script, and homeScroll.ts reaches
// the client-only media hooks.

/**
 * Puts the scroll at the hero (the bottom of the top bleed) while the HTML is still parsing, so the first paint is already
 * in place. Home can be scrolled down from there to its fold, but not up into the bleed.
 */
export const pinHomeScrollScript = `if(matchMedia(${JSON.stringify(MOBILE)}).matches)scrollTo(0,${BLEED_PX})`;
