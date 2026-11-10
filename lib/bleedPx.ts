/**
 * Matches the `max-md:py-48` bleed around Home's hero (12rem) and HomeHero's `max-md:-inset-y-48`: taller than the biggest
 * browser toolbar (Comet's is about 155pt). Apart from homeScroll.ts because Home's page (a Server Component) needs the
 * number for its pin script, and homeScroll.ts reaches the client-only media hooks.
 */
export const BLEED_PX = 192;
