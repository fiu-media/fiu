"use client";

import { Canvas } from "@react-three/fiber";
import { type ReactNode, useState } from "react";
import * as THREE from "three";

import type { LogoMeshMode } from "./buildLogoGeometry";
import type { LogoGlassParams } from "./config/schemas";
import { type LogoTier, TIER_SETTINGS } from "./logoTier";
import { Scene } from "./scene/Scene";
import { CAMERA_FOV, CAMERA_Z } from "./scene/shared";
import type { SceneStill } from "./scene/stills";
import type { SweepRig } from "./scene/sweepRig";

/**
 * The canvas and scene both entry points share: the live hero (`LogoScene`) and the playground. The
 * props are a superset; each entry passes only the ones it needs.
 */
export type CanvasRootProps = {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
  /** Desktop: spin in the centre, then glide to the left-hand resting position. */
  introSlide?: boolean | undefined;
  /** Freeze the intro clock (the logo waits front-facing) until this turns false. */
  introHold?: boolean | undefined;
  /** The hero intro already played on this page load (the scene is being mounted again): start at rest, don't replay it. */
  introPlayed?: boolean | undefined;
  /** Hero intro: false while the splash holds (glass refracts white), true once it starts lifting. */
  splashLift?: boolean | undefined;
  /** When false the canvas ignores the pointer, so whatever is beneath it (the nav) stays clickable. */
  interactive?: boolean | undefined;
  /** Fires once, when the hero intro (spin and glide) has played out in full. */
  onIntroEnd?: () => void | undefined;
  /** The GL context was lost and the canvas can no longer draw; the caller should swap in a fallback. */
  onContextLost?: () => void | undefined;
  /** Starting quality. Read once: antialiasing and the env map size can't change after mount. */
  tier?: LogoTier | undefined;
  /** Even the cheapest tier is below the floor; the caller should swap in the SVG. */
  onTooSlow?: () => void | undefined;
  /** Continuous frameloop at full quality, no adaptation (playground only). */
  measurePerf?: boolean | undefined;
  /** The studio light's shared state, for a driver passed as `sweepDriver` (playground only). */
  rig?: SweepRig | undefined;
  /** Moves the studio light (playground only). Mounted inside the scene, just before the studio. */
  sweepDriver?: ReactNode | undefined;
  /** Extra canvas children, mounted after the scene (playground only). */
  children?: ReactNode | undefined;
};

export function CanvasRoot({
  stills,
  index,
  onReady,
  meshMode,
  params,
  introSlide = false,
  introHold = false,
  introPlayed = false,
  splashLift,
  interactive = true,
  onIntroEnd,
  onContextLost,
  tier = "high",
  onTooSlow,
  measurePerf = false,
  rig,
  sweepDriver,
  children,
}: CanvasRootProps) {
  // The playground measures the preset as set, so it always runs at full quality and never adapts.
  const [startTier] = useState<LogoTier>(measurePerf ? "high" : tier);
  const settings = TIER_SETTINGS[startTier];
  return (
    <Canvas
      frameloop={measurePerf ? "always" : "demand"}
      // R3F gives its root div an inline `pointer-events: auto`, which a class on a wrapper cannot override.
      style={interactive ? undefined : { pointerEvents: "none" }}
      dpr={settings.dpr}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
      gl={{
        alpha: true,
        antialias: settings.antialias,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
        premultipliedAlpha: false,
      }}
      // Transparent clear so the HTML <Image> stills show through untouched;
      // the WebGL backdrop is only sampled for logo refraction (see BackdropLayerGate).
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.style.touchAction = "none";
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost?.();
        });
      }}
    >
      <Scene
        stills={stills}
        index={index}
        onReady={onReady}
        meshMode={meshMode}
        params={params}
        envAlways={measurePerf}
        rig={rig}
        sweepDriver={sweepDriver}
        adaptiveQuality={!measurePerf}
        startTier={startTier}
        onTooSlow={onTooSlow}
        introSlide={introSlide}
        introHold={introHold}
        introPlayed={introPlayed}
        splashLift={splashLift}
        onIntroEnd={onIntroEnd}
      />
      {children}
    </Canvas>
  );
}
