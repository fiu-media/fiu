import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { at } from "@/lib/at";

import type { LogoMeshMode } from "../buildLogoGeometry";
import type { LogoGlassParams } from "../config/schemas";
import { applyLogoTier, type LogoTier, TIER_SETTINGS } from "../logoTier";
import { useKeepAwake } from "../quality/useKeepAwake";
import { useLogoQuality } from "../quality/useLogoQuality";
import { Backdrop } from "./Backdrop";
import { INTRO_END } from "./intro";
import { Logo } from "./Logo";
import { CROSSFADE_SECONDS, type Fade } from "./shared";
import { configureStill, NEUTRAL_TINT, resolveStillTint, type SceneStill } from "./stills";
import { SparkLights, Studio } from "./Studio";
import { type SweepRig, useSweepRig } from "./sweepRig";

export function Scene({
  stills,
  index,
  onReady,
  meshMode,
  params,
  envAlways,
  rig,
  sweepDriver,
  adaptiveQuality,
  startTier,
  onTooSlow,
  introSlide,
  introHold,
  introPlayed,
  splashLift,
  onIntroEnd,
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
  onIntroEnd: (() => void) | undefined;
  startTier: LogoTier;
  onTooSlow: (() => void) | undefined;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
  /** Playground: keep cubemap live while measuring / scrubbing. */
  envAlways: boolean;
  /** Playground: the studio light's shared state, so a driver outside the scene can move it. */
  rig: SweepRig | undefined;
  /** Playground: mounted just before `Studio`, so the light is placed before the cubemap bakes in the same frame. */
  sweepDriver: ReactNode;
  adaptiveQuality: boolean;
  introSlide: boolean;
  introHold: boolean;
  introPlayed: boolean;
  splashLift: boolean | undefined;
}) {
  const gl = useThree((s) => s.gl);
  const [tier, setTier] = useState(startTier);
  const readyRef = useRef(false);
  const tieredParams = useMemo(() => (adaptiveQuality ? applyLogoTier(params, tier) : params), [adaptiveQuality, params, tier]);
  // Only the still on screen at mount gates the first paint (useTexture suspends until it has
  // loaded, so .image is available on first paint here). Decoding and uploading all of them
  // up front cost ~600 ms of the splash for stills nobody sees for another six seconds.
  const [firstSrc] = useState(() => at(stills, index).src);
  const [first] = useTexture([firstSrc], (loaded) => {
    for (const t of loaded) configureStill(t);
  });

  // The rest stream in once the intro is over (uploading them mid-spin would hitch it), or
  // sooner if the hero has already moved on to another still.
  const [introOver, setIntroOver] = useState(!introSlide || introPlayed);
  useLogoQuality({
    adaptive: adaptiveQuality,
    startTier,
    tier,
    setTier,
    readyRef,
    introOver,
    onReady,
    onTooSlow,
  });
  const handleIntroEnd = useCallback(() => {
    setIntroOver(true);
    onIntroEnd?.();
  }, [onIntroEnd]);
  const [rest, setRest] = useState<Record<string, THREE.Texture>>({});
  const loadRest = introOver || at(stills, index).src !== firstSrc;
  const restKey = stills.map((s) => s.src).join("|");
  useEffect(() => {
    if (!loadRest) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    // Fire and forget: the stills past the first load in the background, and a failed one is skipped below.
    void (async () => {
      for (const src of restKey.split("|")) {
        if (src === firstSrc) continue;
        try {
          const t = configureStill(await loader.loadAsync(src));
          // `cancelled` is set by the cleanup below while this awaits, which the types can't see.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (cancelled) {
            t.dispose();
            return;
          }
          // Upload now, at idle, rather than inside the first crossfade that samples it.
          gl.initTexture(t);
          setRest((prev) => ({ ...prev, [src]: t }));
        } catch (error) {
          // A still that fails to load just keeps the previous one behind the glass.
          console.warn("[LogoScene] still failed to load:", src, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 60));
        // `cancelled` is set by the cleanup below while this awaits, which the types can't see.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (cancelled) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRest, restKey, firstSrc, gl]);

  const textures = useMemo(() => stills.map((s) => (s.src === firstSrc ? first : rest[s.src])), [stills, firstSrc, first, rest]);
  const { keepAwake, awakeRef } = useKeepAwake();
  const ownRig = useSweepRig();
  const { groupRef: sweepGroup, liveRef: sweepLive, envRotation } = rig ?? ownRig;
  const fade = useRef<Fade>({ from: index, to: index, start: 0 });
  const tint = useRef(NEUTRAL_TINT.clone());
  // Logo orientation — spark lights lag behind this so highlights crawl on spin.
  const logoPose = useRef({ x: 0, y: 0 });
  const setLogoPose = useCallback((x: number, y: number) => {
    logoPose.current.x = x;
    logoPose.current.y = y;
  }, []);

  const tints = useMemo(() => stills.map((still, i) => resolveStillTint(still, textures[i])), [stills, textures]);

  // Cover intro spin + first settle so env streaks track the logo. The hero intro skips this: the
  // live env bake is the heaviest per-frame cost (freezing it took the intro from ~28 to ~42 fps in
  // a software-GL test), and the pose returns to rest, where the frozen env is already correct, so
  // the spin loses only the lagging highlight crawl. Logo drives its own frames until INTRO_END.
  useEffect(() => {
    if (!introSlide) keepAwake(INTRO_END + 1);
  }, [keepAwake, introSlide]);

  useEffect(() => {
    const f = fade.current;
    if (f.to === index) return;
    f.from = f.to;
    f.to = index;
    f.start = performance.now();
    keepAwake(CROSSFADE_SECONDS + 0.1);
  }, [index, keepAwake]);

  useFrame(() => {
    const f = fade.current;
    const progress = f.start ? Math.min((performance.now() - f.start) / (CROSSFADE_SECONDS * 1000), 1) : 1;
    const k = progress * progress * (3 - 2 * progress);
    tint.current.lerpColors(at(tints, f.from), at(tints, f.to), k);
  });

  return (
    <>
      {/* Layer 1: still plane for refraction only — not drawn to the screen (HTML stills are). */}
      <BackdropLayerGate />
      <Backdrop stills={stills} textures={textures} fade={fade} splashLift={splashLift} />
      <Logo
        readyRef={readyRef}
        tint={tint}
        onPose={setLogoPose}
        meshMode={meshMode}
        params={tieredParams}
        keepAwake={keepAwake}
        introSlide={introSlide}
        introHold={introHold}
        introPlayed={introPlayed}
        onIntroEnd={handleIntroEnd}
      />
      {/* Disable still layer after MTM's FBO capture so the main/bloom pass is logo-only. */}
      <BackdropLayerGate phase="afterTransmission" />
      {sweepDriver}
      {/* Env cubemap re-bakes only while awake (crossfade / drag / intro / a moving sweep); idle uses a frozen map. */}
      <Studio
        tint={tint}
        logoPose={logoPose}
        params={params}
        fade={fade}
        awakeRef={awakeRef}
        sweepLive={sweepLive}
        sweepGroup={sweepGroup}
        envRotation={envRotation}
        envAlways={envAlways}
        envResolution={TIER_SETTINGS[startTier].envResolution}
      />
      {/* External sparkle: lagged point lights (env SoftLights do the glass streaks).
          Full-scene bloom is skipped — it was tonemapping/blooming the stills too. */}
      <SparkLights logoPose={logoPose} lights={params.lights.points} />
    </>
  );
}

/** Still plane lives on layer 1. Mount order matters (same useFrame priority): enable →
 *  MeshTransmissionMaterial FBO capture → disable, so bloom/screen never draw the stills. */
function BackdropLayerGate({ phase = "beforeTransmission" }: { phase?: "beforeTransmission" | "afterTransmission" }) {
  useFrame(({ camera }) => {
    if (phase === "beforeTransmission") camera.layers.enable(1);
    else camera.layers.disable(1);
  });
  return null;
}
