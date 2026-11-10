import type { CSSProperties } from "react";

/**
 * The splash (backdrop + SVG logo) fades out as one while the glass logo fades in on top and its
 * refracted field clears from white to the photo. All three share this duration, so changing it
 * here retimes the whole handoff.
 */
export const SPLASH_FADE_MS = 400;

/** CSS custom property carrying the fade, read by `duration-(--splash-fade)` classes. */
export const splashFadeVars = { "--splash-fade": `${SPLASH_FADE_MS}ms` } as CSSProperties;

/** Keep the splash up at least this long so a fast load doesn't flash it. */
export const SPLASH_MIN_MS = 800;
/** Never hold the splash longer than this, even if the live scene never reports ready. */
export const SPLASH_MAX_MS = 4000;
/**
 * The splash fades as one (backdrop + SVG logo) over SPLASH_FADE_MS while the glass logo fades in
 * on top over the same time. The spin starts partway through that fade, so the two read as one
 * gesture. It can't start at 0: the spin front-loads its speed, and the glass would visibly turn
 * away from the SVG it is cross-fading with.
 */
export const SPIN_DELAY_MS = SPLASH_FADE_MS * 0.35;
/**
 * Static mode has no scene to report the end of the intro, so the stills start rotating this long
 * after the splash lifts (the logo's 300 ms delay + 1 s slide, plus margin).
 */
export const INTRO_SETTLE_MS = 2000;
/**
 * Live mode: the scene reports the end of its intro (`onIntroEnd`), which on a slow device runs
 * well past INTRO_SETTLE_MS, since its clock is frame-capped. Swapping the layout/stacking or
 * starting still rotation mid-spin costs a layer re-composite and extra WebGL work on the frames
 * that matter most. This is only a backstop for a scene that stops drawing.
 */
export const INTRO_BACKSTOP_MS = 12000;
/** A scene that turns out too slow fades out over the SVG's own fade-in (`duration-700` in HomeHero), then unmounts. */
export const SLOW_FADE_MS = 700;
