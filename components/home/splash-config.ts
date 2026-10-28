import type { CSSProperties } from "react";

/**
 * The splash (backdrop + SVG logo) fades out as one while the glass logo fades in on top and its
 * refracted field clears from white to the photo. All three share this duration, so changing it
 * here retimes the whole handoff.
 */
export const SPLASH_FADE_MS = 400;

/** CSS custom property carrying the fade, read by `duration-(--splash-fade)` classes. */
export const splashFadeVars = { "--splash-fade": `${SPLASH_FADE_MS}ms` } as CSSProperties;
