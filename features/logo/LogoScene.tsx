"use client";

import { CanvasRoot, type CanvasRootProps } from "./CanvasRoot";
import { LOGO_PARAM_PRESETS } from "./config/presets";
import { preloadStill } from "./scene/stills";

type LogoSceneProps = Pick<
  CanvasRootProps,
  | "stills"
  | "index"
  | "onReady"
  | "introSlide"
  | "introHold"
  | "introPlayed"
  | "splashLift"
  | "interactive"
  | "onIntroEnd"
  | "onContextLost"
  | "tier"
  | "onTooSlow"
>;

/**
 * The live home hero: the rotating stills are drawn into the scene as a backdrop, so the
 * glass logo actually refracts whichever still is behind it.
 *
 * Logo mesh is built in Three.js from `fiu-logo-paths.json` (silhouette extrude + chamfered
 * diamonds) — no GLB for the web.
 *
 * Rendering is on demand. Frames are only drawn while something moves (intro spin,
 * crossfade, pointer parallax), so an idle hero costs nothing.
 *
 * Quality starts at `tier`. Before reporting ready, the scene times a few frames and may drop to a
 * cheaper tier, or call `onTooSlow` if even the cheapest can't hold the floor (see `logoTier.ts`).
 *
 * The playground has its own entry, with the extra controls (`dev/logo-playground/PlaygroundScene`).
 */
export default function LogoScene(props: LogoSceneProps) {
  // Start loading the first still before the canvas mounts. If it has resolved by the time Scene
  // first renders, useTexture reads it from cache and never suspends. A suspend would cost
  // React's 300 ms Suspense reveal throttle, even with the image already in the HTTP cache.
  preloadStill(props.stills[props.index]!.src);
  return <CanvasRoot {...props} meshMode="extrude" params={LOGO_PARAM_PRESETS.light} />;
}
