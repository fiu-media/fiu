"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";

import {
  decideLogoTier,
  INTRO_BACKSTOP_MS,
  INTRO_SETTLE_MS,
  rememberTooSlow,
  SLOW_FADE_MS,
  SPIN_DELAY_MS,
  SPLASH_MAX_MS,
  SPLASH_MIN_MS,
} from "@/features/logo";
import { prefersReducedMotion, subscribeToReducedMotion } from "@/lib/hooks/useReducedMotion";

import {
  initialIntro,
  introReducer,
  selectIntroDone,
  selectLogoAtLeft,
  selectMode,
  selectSceneTier,
  selectSnapToLeft,
  selectSpinGo,
  selectSplashDone,
  type Support,
} from "./intro";
import { getStill, markIntroPlayed, setStill } from "./session";

/**
 * "pending" on the server and during hydration, then the glass logo's starting tier, or "static"
 * (the SVG) for reduced motion, devices below the floor, and a hero with no still for the glass to refract
 * (`hasStills` false). See `logoTier.ts`.
 */
function useLiveSupport(hasStills: boolean): Support {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => (!hasStills || prefersReducedMotion() ? "static" : decideLogoTier()),
    () => "pending",
  );
}

/**
 * The home hero's intro (splash, then the logo spinning, then settled): `introReducer` holds the state and this hook
 * feeds it the timers and the scene's callbacks. The intro is one schedule: the splash lifts, the glass logo starts to
 * spin partway through the fade, and the intro settles. Held in "splash" until the gates open, and skipped when the
 * splash was already dismissed. `hasStills` is whether the hero has any photography: without it there is no glass logo.
 */
export function useHeroIntro(hasStills: boolean) {
  const [state, dispatch] = useReducer(introReducer, undefined, initialIntro);
  const support = useLiveSupport(hasStills);
  const mode = selectMode(state, support);
  const splashDone = selectSplashDone(state, support);
  const introDone = selectIntroDone(state);
  const tier = support === "pending" || support === "static" ? null : support;

  useEffect(() => {
    const timers = [
      window.setTimeout(() => dispatch({ type: "minElapsed" }), SPLASH_MIN_MS),
      window.setTimeout(() => dispatch({ type: "timedOut" }), SPLASH_MAX_MS),
    ];
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    // A scene that ends its intro first settles the stage itself (onIntroEnd), so these never move it backwards.
    const timers = [
      window.setTimeout(() => dispatch({ type: "spinDue" }), SPIN_DELAY_MS),
      window.setTimeout(() => dispatch({ type: "settled" }), mode === "live" ? INTRO_BACKSTOP_MS : INTRO_SETTLE_MS),
    ];
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [splashDone, mode]);

  useEffect(() => {
    if (introDone) markIntroPlayed();
  }, [introDone]);

  const fading = Boolean(state.slow?.fading);
  useEffect(() => {
    if (!fading) return;
    const id = window.setTimeout(() => dispatch({ type: "slowFadeDone" }), SLOW_FADE_MS);
    return () => window.clearTimeout(id);
  }, [fading]);

  const onReady = useCallback(() => dispatch({ type: "sceneReady" }), []);
  const onIntroEnd = useCallback(() => dispatch({ type: "settled" }), []);
  const onFail = useCallback(() => dispatch({ type: "sceneFailed" }), []);
  const onTooSlow = useCallback(() => {
    if (!tier) return;
    rememberTooSlow();
    dispatch({ type: "tooSlow", tier });
  }, [tier]);

  return {
    mode,
    sceneTier: selectSceneTier(state, support),
    splashDone,
    spinGo: selectSpinGo(state),
    introDone,
    logoAtLeft: selectLogoAtLeft(state, support),
    snapToLeft: selectSnapToLeft(state),
    resumed: state.resumed,
    sceneReady: state.sceneReady,
    slow: state.slow !== null,
    onReady,
    onIntroEnd,
    onFail,
    onTooSlow,
  };
}

const ROTATE_SECONDS = 6;

/**
 * Which of `keys` (one per still) is showing, moving on every ROTATE_SECONDS while `enabled` and not `paused` (by the visitor). Held until the intro is over so a
 * still crossfade (and its extra rendering) never lands mid-spin, and while nobody can see the hero (`useHeroWatched`). A hero that mounts again (a language switch) opens on the
 * still that was showing, found by its key because another language's set may be ordered differently.
 */
export function useStillRotation(keys: string[], enabled: boolean, paused = false) {
  const count = keys.length;
  const [index, setIndex] = useState(() => Math.max(0, keys.indexOf(getStill() ?? "")));
  useEffect(() => {
    // One still (or none) has nothing to move on to.
    if (!enabled || paused || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [enabled, paused, count]);
  // Only a move is recorded, not a mount: a hero that mounts again opens on the still that was carried over, and must
  // not overwrite it with its own first one before it has found it.
  const shown = useRef(index);
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    const key = keys[index % count];
    if (key !== undefined) setStill(key);
  }, [index, keys, count]);
  return index;
}
