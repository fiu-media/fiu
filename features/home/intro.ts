import type { LogoDecision, LogoTier } from "@/features/logo";

import { hasIntroPlayed, isSplashDismissed } from "./session";

/** splash up, then the logo spinning, then settled (stills rotate, scene interactive). */
export type Stage = "splash" | "spin" | "settled";
export type Mode = "pending" | "live" | "static";

/** "pending" on the server and during hydration, then the glass logo's starting tier, or "static". See `logoTier.ts`. */
export type Support = "pending" | LogoDecision;

export type IntroState = {
  stage: Stage;
  /** The splash has been up for its minimum time. */
  minElapsed: boolean;
  /** The splash has been up for its maximum time: lift it whether or not the scene is ready. */
  timedOut: boolean;
  sceneReady: boolean;
  /** The scene threw or lost its context, so the SVG logo stays. */
  failed: boolean;
  /**
   * The scene ran but was too slow: it fades out over the SVG (`fading`), then unmounts. Keeps the
   * scene's tier, since the device's own decision turns to "static" at once. `settled` is whether the
   * intro had ended by then, so the SVG takes over already at rest.
   */
  slow: { fading: boolean; settled: boolean; tier: LogoTier } | null;
  /** A hero mounted after the intro already played shows the SVG at rest (left) until the glass logo takes over in place. */
  resumed: boolean;
};

export type IntroEvent =
  | { type: "minElapsed" }
  | { type: "timedOut" }
  | { type: "sceneReady" }
  | { type: "spinDue" }
  | { type: "settled" }
  | { type: "sceneFailed" }
  | { type: "tooSlow"; tier: LogoTier }
  | { type: "slowFadeDone" };

/** The intro is skipped when the splash was already dismissed, and the logo comes back at rest after it played. */
export function initialIntro(): IntroState {
  const dismissed = isSplashDismissed();
  return {
    stage: dismissed ? "settled" : "splash",
    minElapsed: dismissed,
    timedOut: dismissed,
    sceneReady: false,
    failed: false,
    slow: null,
    resumed: hasIntroPlayed(),
  };
}

export function introReducer(state: IntroState, event: IntroEvent): IntroState {
  switch (event.type) {
    case "minElapsed":
      return { ...state, minElapsed: true };
    case "timedOut":
      return { ...state, timedOut: true };
    case "sceneReady":
      return { ...state, sceneReady: true };
    // A scene that ends its intro first settles the stage itself, so the spin timer never moves it backwards.
    case "spinDue":
      return state.stage === "splash" ? { ...state, stage: "spin" } : state;
    case "settled":
      return { ...state, stage: "settled" };
    case "sceneFailed":
      return { ...state, failed: true };
    case "tooSlow":
      return { ...state, slow: { fading: true, settled: state.stage === "settled", tier: event.tier } };
    case "slowFadeDone":
      return state.slow ? { ...state, slow: { ...state.slow, fading: false } } : state;
  }
}

// Selectors. `support` comes from outside the reducer (reduced motion, the device's tier), so it is passed in.

/** The tier the device starts at, or null for the SVG. */
const supportTier = (support: Support): LogoTier | null => (support === "pending" || support === "static" ? null : support);

export function selectMode(state: IntroState, support: Support): Mode {
  if (state.failed || state.slow) return "static";
  if (support === "pending") return "pending";
  return supportTier(support) ? "live" : "static";
}

/** The tier the mounted scene draws at; null when there is no scene. */
export function selectSceneTier(state: IntroState, support: Support): LogoTier | null {
  if (state.failed) return null;
  if (state.slow) return state.slow.fading ? state.slow.tier : null;
  return supportTier(support);
}

export function selectSplashDone(state: IntroState, support: Support): boolean {
  const mode = selectMode(state, support);
  return state.timedOut || (state.minElapsed && (mode === "live" ? state.sceneReady : mode === "static"));
}

export const selectSpinGo = (state: IntroState) => state.stage !== "splash";
export const selectIntroDone = (state: IntroState) => state.stage === "settled";

/**
 * The static SVG logo starts centred under the splash, then glides left on desktop. Taking over from a
 * settled glass logo, it is already there.
 */
export function selectLogoAtLeft(state: IntroState, support: Support): boolean {
  return (selectMode(state, support) === "static" || state.resumed) && selectSplashDone(state, support);
}

export const selectSnapToLeft = (state: IntroState) => Boolean(state.slow?.settled) || state.resumed;
