"use client";

import { Environment, MeshTransmissionMaterial, useCursor, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type MutableRefObject,
  type RefObject,
} from "react";
import * as THREE from "three";
import paths from "@/public/brand/fiu-logo-paths.json";
import { buildLogoGeometry, type LogoMeshMode, type LogoPaths } from "./buildLogoGeometry";
import { LOGO_PARAM_PRESETS, type LogoGlassParams, type LogoRimLook } from "./logoConfig";
import type { LogoPerfStats } from "./logoPerf";

export type { LogoMeshMode };
export type { LogoRimLook, LogoGlassParams } from "./logoConfig";
export type { LogoPerfStats } from "./logoPerf";

const BACKDROP_Z = -4;
// A distant, narrow camera keeps the slab's front face from projecting wider than its back, so the
// front-facing glass logo matches the flat SVG logo's outline (at 12 it overlapped the artwork by
// 82%, at 48 by 93%). The fov is chosen so the view at z = 0 is the same size as the old fov-30
// camera at z = 12, i.e. everything else keeps its size.
const CAMERA_Z = 48;
const CAMERA_FOV = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(15)) * (12 / CAMERA_Z)) * 180) / Math.PI;
const CROSSFADE_SECONDS = 1.6;
const SAMPLE_SIZE = 32;
const NEUTRAL_TINT = new THREE.Color("#c8c4c0");
/**
 * Hero intro: the glass starts out refracting a bright white field, so it reads as the white
 * splash logo it replaces, then clears to the photo. Above 1 because ACES tone mapping pulls
 * a plain 1.0 down to light grey.
 */
const SPLASH_WHITE = 1.5;
// The refracted field goes white → photo over exactly the splash fade (500 ms, ease-out, same
// curve as the CSS), so the glass clears as the splash lifts; a slower curve left a white glass
// logo hanging around after the backdrop had gone.
const REVEAL_SECONDS = 0.5;

export type SceneStill = {
  src: string;
  width: number;
  height: number;
  /** CMS-provided studio tint (hex). Prefer this over client sampling — CORS-safe. */
  lightTint?: string;
};

type Fade = { from: number; to: number; start: number };

/**
 * The live home hero: the rotating stills are drawn into the scene as a backdrop, so the
 * glass logo actually refracts whichever still is behind it.
 *
 * Logo mesh is built in Three.js from `fiu-logo-paths.json` (variable-radius tubes or
 * silhouette extrude + chamfered diamonds) — no GLB for the web.
 *
 * Rendering is on demand. Frames are only drawn while something moves (intro spin,
 * crossfade, pointer parallax), so an idle hero costs nothing.
 */
export default function LogoScene({
  stills,
  index,
  onReady,
  meshMode = "extrude",
  rimLook = "light",
  params: paramsProp,
  measurePerf = false,
  onPerf,
  introSlide = false,
  introHold = false,
  splashLift,
  interactive = true,
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
  /** Desktop: spin in the centre, then glide to the left-hand resting position. */
  introSlide?: boolean;
  /** Freeze the intro clock (the logo waits front-facing) until this turns false. */
  introHold?: boolean;
  /** Hero intro: false while the splash holds (glass refracts white), true once it starts lifting. */
  splashLift?: boolean;
  /** When false the canvas ignores the pointer, so whatever is beneath it (the nav) stays clickable. */
  interactive?: boolean;
  /** `tubes` = liquid-glass taper; `extrude` = flat silhouette slab. */
  meshMode?: LogoMeshMode;
  /** `light` = luminous bevels; `dark` = charcoal liquid-glass bands. */
  rimLook?: LogoRimLook;
  /** Live overrides (playground). Defaults to the rimLook preset. */
  params?: LogoGlassParams;
  /** Continuous frameloop + FPS sampling (playground only). */
  measurePerf?: boolean;
  onPerf?: (stats: LogoPerfStats) => void;
}) {
  const params = paramsProp ?? LOGO_PARAM_PRESETS[rimLook];
  const dpr = useCanvasDpr(measurePerf);
  return (
    <Canvas
      frameloop={measurePerf ? "always" : "demand"}
      // R3F gives its root div an inline `pointer-events: auto`, which a class on a wrapper cannot override.
      style={interactive ? undefined : { pointerEvents: "none" }}
      dpr={dpr}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
        premultipliedAlpha: false,
      }}
      // Transparent clear so the HTML <Image> stills show through untouched;
      // the WebGL backdrop is only sampled for logo refraction (see BackdropLayerGate).
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Scene
        stills={stills}
        index={index}
        onReady={onReady}
        meshMode={meshMode}
        params={params}
        envAlways={measurePerf}
        adaptiveQuality={!measurePerf}
        introSlide={introSlide}
        introHold={introHold}
        splashLift={splashLift}
      />
      {measurePerf && onPerf ? <PerfSampler onPerf={onPerf} /> : null}
    </Canvas>
  );
}

/** Cap pixel ratio on mobile / Save-Data; playground keeps a higher ceiling. */
function useCanvasDpr(measurePerf: boolean): number | [number, number] {
  const [dpr, setDpr] = useState<number | [number, number]>(() => (measurePerf ? [1, 1.5] : [1, 1.25]));
  useEffect(() => {
    if (measurePerf) {
      setDpr([1, 1.5]);
      return;
    }
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => {
      const saveData = Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
      );
      setDpr(mq.matches || saveData ? 1 : [1, 1.25]);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [measurePerf]);
  return dpr;
}

/**
 * Step samples/resolution down if FPS stays low, recover when it climbs back.
 * Disabled in the playground so slider values stay honest.
 */
function useAdaptiveTransmission(enabled: boolean, samples: number, resolution: number) {
  const [tier, setTier] = useState(0);
  const lowAcc = useRef(0);
  const highAcc = useRef(0);
  const tierRef = useRef(0);
  tierRef.current = tier;

  useFrame((_, delta) => {
    if (!enabled) {
      if (tierRef.current !== 0) setTier(0);
      return;
    }
    const fps = delta > 0 ? 1 / delta : 60;
    if (fps < 30) {
      lowAcc.current += delta;
      highAcc.current = 0;
      if (lowAcc.current > 1.2 && tierRef.current < 2) {
        lowAcc.current = 0;
        setTier((t) => Math.min(2, t + 1));
      }
    } else if (fps > 48) {
      highAcc.current += delta;
      lowAcc.current = 0;
      if (highAcc.current > 2 && tierRef.current > 0) {
        highAcc.current = 0;
        setTier((t) => Math.max(0, t - 1));
      }
    } else {
      lowAcc.current = 0;
      highAcc.current = 0;
    }
  });

  if (!enabled || tier === 0) return { samples, resolution, tier: 0 };
  return {
    samples: Math.max(4, samples - tier * 2),
    resolution: Math.max(256, resolution - tier * 256),
    tier,
  };
}

/** Samples FPS / frame time and renderer info ~2×/sec for the playground HUD. */
function PerfSampler({ onPerf }: { onPerf: (stats: LogoPerfStats) => void }) {
  const gl = useThree((s) => s.gl);
  const onPerfRef = useRef(onPerf);
  onPerfRef.current = onPerf;
  const bucket = useRef({ started: performance.now(), frames: 0, frameMs: 0 });

  useFrame((_, delta) => {
    const b = bucket.current;
    b.frames += 1;
    b.frameMs = delta * 1000;
    const now = performance.now();
    if (now - b.started < 500) return;
    const fps = (b.frames * 1000) / (now - b.started);
    b.frames = 0;
    b.started = now;
    onPerfRef.current({
      fps,
      frameMs: b.frameMs,
      triangles: gl.info.render.triangles,
      calls: gl.info.render.calls,
    });
  });

  return null;
}

function Scene({
  stills,
  index,
  onReady,
  meshMode,
  params,
  envAlways,
  adaptiveQuality,
  introSlide,
  introHold,
  splashLift,
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
  /** Playground: keep cubemap live while measuring / scrubbing. */
  envAlways: boolean;
  adaptiveQuality: boolean;
  introSlide: boolean;
  introHold: boolean;
  splashLift: boolean | undefined;
}) {
  // useTexture suspends until loaded, so .image is available on first paint here.
  const textures = useTexture(
    stills.map((s) => s.src),
    (loaded) => {
      for (const t of loaded) {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
      }
    },
  );
  const { keepAwake, awakeRef } = useKeepAwake();
  const fade = useRef<Fade>({ from: index, to: index, start: 0 });
  const tint = useRef(NEUTRAL_TINT.clone());
  // Logo orientation — spark lights lag behind this so highlights crawl on spin.
  const logoPose = useRef({ x: 0, y: 0 });

  const tints = useMemo(
    () => stills.map((still, i) => resolveStillTint(still, textures[i])),
    [stills, textures],
  );

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
    const progress = f.start
      ? Math.min((performance.now() - f.start) / (CROSSFADE_SECONDS * 1000), 1)
      : 1;
    const k = progress * progress * (3 - 2 * progress);
    tint.current.lerpColors(tints[f.from]!, tints[f.to]!, k);
  });

  return (
    <>
      {/* Layer 1: still plane for refraction only — not drawn to the screen (HTML stills are). */}
      <BackdropLayerGate />
      <Backdrop stills={stills} textures={textures} fade={fade} splashLift={splashLift} />
      <Logo
        onReady={onReady}
        tint={tint}
        logoPose={logoPose}
        meshMode={meshMode}
        params={params}
        keepAwake={keepAwake}
        adaptiveQuality={adaptiveQuality}
        introSlide={introSlide}
        introHold={introHold}
        splashLift={splashLift}
      />
      {/* Disable still layer after MTM's FBO capture so the main/bloom pass is logo-only. */}
      <BackdropLayerGate phase="afterTransmission" />
      {/* Env cubemap re-bakes only while awake (crossfade / drag / intro); idle uses a frozen map. */}
      <Studio tint={tint} logoPose={logoPose} params={params} fade={fade} awakeRef={awakeRef} envAlways={envAlways} />
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

/** How quickly spark lights catch the logo pose — lower = slower highlight travel. */
const SPARK_FOLLOW = 1.1;

/**
 * Soft fill only — point lights make round specular blobs. Streaks come from
 * elongated env SoftLights + anisotropic transmission instead.
 */
function SparkLights({
  logoPose,
  lights,
}: {
  logoPose: MutableRefObject<{ x: number; y: number }>;
  lights: LogoGlassParams["lights"]["points"];
}) {
  const follow = useRef<THREE.Group>(null);
  const fixed = lights.filter((l) => l.enabled && !l.followPose);
  const moving = lights.filter((l) => l.enabled && l.followPose);
  useFrame((_, delta) => {
    const g = follow.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, logoPose.current.x, SPARK_FOLLOW, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, logoPose.current.y, SPARK_FOLLOW, delta);
  });
  return (
    <>
      {fixed.map((l) => (
        <pointLight
          key={l.id}
          position={[l.x, l.y, l.z]}
          intensity={l.intensity}
          distance={l.distance}
          decay={l.decay}
          color={l.color}
        />
      ))}
      <group ref={follow}>
        {moving.map((l) => (
          <pointLight
            key={l.id}
            position={[l.x, l.y, l.z]}
            intensity={l.intensity}
            distance={l.distance}
            decay={l.decay}
            color={l.color}
          />
        ))}
      </group>
    </>
  );
}

/** Keeps the demand-driven loop running for `seconds` from now. */
function useKeepAwake() {
  const invalidate = useThree((s) => s.invalidate);
  const until = useRef(0);
  const awakeRef = useRef(true);
  useFrame(() => {
    const awake = performance.now() < until.current;
    awakeRef.current = awake;
    if (awake) invalidate();
  });
  const keepAwake = useCallback(
    (seconds: number) => {
      until.current = Math.max(until.current, performance.now() + seconds * 1000);
      awakeRef.current = true;
      invalidate();
    },
    [invalidate],
  );
  return { keepAwake, awakeRef };
}

/**
 * Env portal frames: Infinity while the scene is moving (tint / pose), else 1 so the
 * cubemap freezes. Playground passes envAlways to keep scrubbing live.
 */
function useEnvFrames(
  fade: RefObject<Fade>,
  awakeRef: MutableRefObject<boolean>,
  envAlways: boolean,
) {
  const [frames, setFrames] = useState<number>(Infinity);
  const liveRef = useRef(true);
  useFrame(() => {
    const f = fade.current;
    const fading = Boolean(f?.start) && performance.now() - f.start < CROSSFADE_SECONDS * 1000;
    const live = envAlways || awakeRef.current || fading;
    if (live === liveRef.current) return;
    liveRef.current = live;
    setFrames(live ? Infinity : 1);
  });
  return frames;
}

/** Prefer CMS `lightTint`; else sample the texture; else neutral. Sampling failures (CORS) fall through. */
function resolveStillTint(still: SceneStill, texture?: THREE.Texture): THREE.Color {
  if (still.lightTint) {
    try {
      return new THREE.Color(still.lightTint);
    } catch {
      /* fall through */
    }
  }
  if (texture?.image) {
    const sampled = sampleAverageColor(texture);
    if (sampled) return sampled;
  }
  return NEUTRAL_TINT.clone();
}

/** Downsample and average. Returns null if the image can't be read (tainted / not ready). */
function sampleAverageColor(texture: THREE.Texture): THREE.Color | null {
  const img = texture.image as CanvasImageSource | undefined;
  if (!img || typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    let r = 0;
    let g = 0;
    let b = 0;
    let w = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lr = data[i]! / 255;
      const lg = data[i + 1]! / 255;
      const lb = data[i + 2]! / 255;
      // Bright pixels weigh more — they dominate how glass reads temperature.
      const lum = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      const weight = 0.2 + lum * lum;
      r += lr * weight;
      g += lg * weight;
      b += lb * weight;
      w += weight;
    }
    if (w < 1e-6) return null;

    const color = new THREE.Color(r / w, g / w, b / w);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    // Push chroma so glass reflections read the still's temperature clearly.
    color.setHSL(hsl.h, Math.min(0.75, Math.max(0.35, hsl.s * 1.6)), THREE.MathUtils.clamp(hsl.l, 0.32, 0.58));
    return color;
  } catch {
    return null;
  }
}

const backdropVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Same cover-fit as the HTML <Image> stills (object-fit: cover) so refraction matches
// the full-bleed hero behind the logo.
const backdropFragment = /* glsl */ `
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform float fromAspect;
uniform float toAspect;
uniform float planeAspect;
uniform float progress;
uniform float reveal;
uniform float whiteLevel;
varying vec2 vUv;
vec2 cover(vec2 uv, float imageAspect) {
  vec2 scale = planeAspect > imageAspect
    ? vec2(1.0, imageAspect / planeAspect)
    : vec2(planeAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}
void main() {
  vec4 a = texture2D(tFrom, cover(vUv, fromAspect));
  vec4 b = texture2D(tTo, cover(vUv, toAspect));
  vec4 still = mix(a, b, smoothstep(0.0, 1.0, progress));
  gl_FragColor = vec4(mix(vec3(whiteLevel), still.rgb, reveal), still.a);
  #include <colorspace_fragment>
}`;

function Backdrop({
  stills,
  textures,
  fade,
  splashLift,
}: {
  stills: SceneStill[];
  textures: THREE.Texture[];
  fade: RefObject<Fade>;
  splashLift: boolean | undefined;
}) {
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.viewport);

  const material = useRef<THREE.ShaderMaterial>(null);
  const [uniforms] = useState(() => ({
    tFrom: { value: null as THREE.Texture | null },
    tTo: { value: null as THREE.Texture | null },
    fromAspect: { value: 1 },
    toAspect: { value: 1 },
    planeAspect: { value: 1 },
    progress: { value: 1 },
    reveal: { value: 1 },
    whiteLevel: { value: SPLASH_WHITE },
  }));
  const revealStart = useRef<number | null>(null);

  const { width, height } = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, BACKDROP_Z));

  useFrame(() => {
    const f = fade.current;
    const u = material.current?.uniforms;
    if (!f || !u) return;
    u.tFrom.value = textures[f.from]!;
    u.tTo.value = textures[f.to]!;
    u.fromAspect.value = stills[f.from]!.width / stills[f.from]!.height;
    u.toAspect.value = stills[f.to]!.width / stills[f.to]!.height;
    u.planeAspect.value = width / height;
    u.progress.value = f.start
      ? Math.min((performance.now() - f.start) / (CROSSFADE_SECONDS * 1000), 1)
      : 1;

    // Playground (splashLift undefined) always sees the photo.
    let reveal = 1;
    if (splashLift === false) {
      revealStart.current = null;
      reveal = 0;
    } else if (splashLift) {
      revealStart.current ??= performance.now();
      const k = THREE.MathUtils.clamp((performance.now() - revealStart.current) / 1000 / REVEAL_SECONDS, 0, 1);
      reveal = 1 - (1 - k) * (1 - k);
    }
    u.reveal.value = reveal;
  });

  return (
    <mesh
      position={[0, 0, BACKDROP_Z]}
      renderOrder={-1}
      ref={(m) => {
        if (m) m.layers.set(1);
      }}
    >
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={material}
        vertexShader={backdropVertex}
        fragmentShader={backdropFragment}
        uniforms={uniforms}
        depthWrite={false}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

/** Radial alpha falloff so softboxes don't hard-cut at the rim. */
function useFeatherMap() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.85)");
    g.addColorStop(0.75, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.NoColorSpace;
    return map;
  }, []);
}

/**
 * Dual-key front studio: large feathered softboxes (upper-left key + lower-right fill),
 * still-tinted, plus lagged white streak lights for sparkle lines inside the glass.
 */
function Studio({
  tint,
  logoPose,
  params,
  fade,
  awakeRef,
  envAlways,
}: {
  tint: MutableRefObject<THREE.Color>;
  logoPose: MutableRefObject<{ x: number; y: number }>;
  params: LogoGlassParams;
  fade: RefObject<Fade>;
  awakeRef: MutableRefObject<boolean>;
  envAlways: boolean;
}) {
  const follow = useRef<THREE.Group>(null);
  const feather = useFeatherMap();
  const frames = useEnvFrames(fade, awakeRef, envAlways);
  const soft = params.lights.soft.filter((l) => l.enabled);
  const fixed = soft.filter((l) => !l.followPose);
  const moving = soft.filter((l) => l.followPose);
  useFrame((_, delta) => {
    const g = follow.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, logoPose.current.x, SPARK_FOLLOW, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, logoPose.current.y, SPARK_FOLLOW, delta);
  });
  return (
    <Environment resolution={256} frames={frames}>
      {fixed.map((l) => (
        <SoftLight
          key={l.id}
          tint={tint}
          mixWhite={l.mixWhite}
          intensity={l.intensity}
          lift={l.lift}
          position={[l.x, l.y, l.z]}
          scale={[l.scaleX, l.scaleY, l.scaleZ]}
          streak={l.kind === "streak"}
          roll={l.roll}
          feather={l.feather ? feather : undefined}
        />
      ))}
      <group ref={follow}>
        {moving.map((l) => (
          <SoftLight
            key={l.id}
            tint={tint}
            mixWhite={l.mixWhite}
            intensity={l.intensity}
            lift={l.lift}
            position={[l.x, l.y, l.z]}
            scale={[l.scaleX, l.scaleY, l.scaleZ]}
            streak={l.kind === "streak"}
            roll={l.roll}
            feather={l.feather ? feather : undefined}
          />
        ))}
      </group>
    </Environment>
  );
}

function SoftLight({
  tint,
  mixWhite,
  intensity,
  lift = 1,
  position,
  scale,
  ring = false,
  streak = false,
  roll = 0,
  feather,
}: {
  tint: MutableRefObject<THREE.Color>;
  mixWhite: number;
  intensity: number;
  lift?: number;
  position: [number, number, number];
  scale: number | [number, number, number];
  ring?: boolean;
  /** Long thin plane — reads as a sparkle line once refracted through the glass. */
  streak?: boolean;
  /** Twist around the look-at axis (radians). */
  roll?: number;
  /** Optional radial alpha map for soft falloff. */
  feather?: THREE.Texture;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.lookAt(0, 0, 0);
    if (roll) m.rotateZ(roll);
  }, [position[0], position[1], position[2], roll]);

  useFrame(() => {
    const m = mat.current;
    if (!m) return;
    tmp.copy(tint.current).multiplyScalar(lift);
    m.color.setRGB(
      THREE.MathUtils.lerp(tmp.r, 1, mixWhite) * intensity,
      THREE.MathUtils.lerp(tmp.g, 1, mixWhite) * intensity,
      THREE.MathUtils.lerp(tmp.b, 1, mixWhite) * intensity,
    );
  });

  return (
    <mesh ref={mesh} position={position} scale={scale}>
      {streak ? (
        <planeGeometry args={[1, 1]} />
      ) : ring ? (
        <ringGeometry args={[0.22, 0.5, 24]} />
      ) : (
        <ringGeometry args={[0, 0.5, 24]} />
      )}
      <meshBasicMaterial
        ref={mat}
        side={THREE.DoubleSide}
        toneMapped={false}
        map={feather}
        transparent={Boolean(feather)}
        depthWrite={false}
      />
    </mesh>
  );
}

// Intro spin, from the original Blender keyframes (24 fps): a full turn, overshoot, settle.
const SPIN: [seconds: number, radians: number][] = [
  [0, 0],
  [71 / 24, -Math.PI * 2],
  [83 / 24, -Math.PI * 2 - 0.1],
  [95 / 24, -Math.PI * 2],
];

const SPIN_END = SPIN[SPIN.length - 1][0];
const WARMUP_FRAMES = 3;

// Hero intro (`introSlide`): `HERO_TURNS` turns that spin up fast and decelerate like a spun coin,
// then a springy glide to the left that overshoots and settles. Times in seconds.
const HERO_TURNS = 1;
const HERO_SPIN_SECONDS = 2.2;
/** Glide starts mid-deceleration so the spin hands over to the move. */
const SLIDE_START = 1;
const SLIDE_SECONDS = 2.2;
/** Spring: damping ratio < 1 overshoots (0.65 ≈ 7% past the target); omega sets the speed. */
const SLIDE_DAMPING = 0.65;
const SLIDE_OMEGA = 4.5;
const HERO_END = Math.max(HERO_SPIN_SECONDS, SLIDE_START + SLIDE_SECONDS);
/** Longest intro, so the demand loop stays awake for it. */
const INTRO_END = Math.max(SPIN_END, HERO_END);

function heroSpinAt(t: number) {
  const k = Math.min(Math.max(t / HERO_SPIN_SECONDS, 0), 1);
  // k^0.6 front-loads the speed; the cosine ease gives a soft start and a long settle.
  return -Math.PI * 2 * HERO_TURNS * (0.5 - 0.5 * Math.cos(Math.PI * k ** 0.6));
}

/** Damped-spring step response: 0 → 1 with overshoot, snapped to 1 once settled. */
function slideAt(t: number) {
  const tau = t - SLIDE_START;
  if (tau <= 0) return 0;
  if (tau >= SLIDE_SECONDS) return 1;
  const z = SLIDE_DAMPING;
  const wd = SLIDE_OMEGA * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * SLIDE_OMEGA * tau) * (Math.cos(wd * tau) + ((z * SLIDE_OMEGA) / wd) * Math.sin(wd * tau));
}

function spinAt(t: number) {
  for (let i = 1; i < SPIN.length; i++) {
    const [t1, v1] = SPIN[i];
    const [t0, v0] = SPIN[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * k * k * (3 - 2 * k); // smoothstep ≈ Blender's auto-clamped Bézier
    }
  }
  return SPIN[SPIN.length - 1][1];
}

/** Start the return spring once coasting has nearly stopped (not exactly 0). */
const DRAG_VELOCITY_EPS = 0.08;
const DRAG_ANGLE_EPS = 0.0015;

/** Wrap to (-π, π] so return takes the shortest way home. */
function shortestAngle(radians: number) {
  const wrapped = ((radians + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return wrapped === -Math.PI ? Math.PI : wrapped;
}

function Logo({
  onReady,
  tint,
  logoPose,
  meshMode,
  params,
  keepAwake,
  adaptiveQuality,
  introSlide,
  introHold,
  splashLift,
}: {
  onReady: () => void;
  tint: MutableRefObject<THREE.Color>;
  logoPose: MutableRefObject<{ x: number; y: number }>;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
  keepAwake: (seconds: number) => void;
  adaptiveQuality: boolean;
  introSlide: boolean;
  introHold: boolean;
  splashLift: boolean | undefined;
}) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  // drei types MeshTransmissionMaterial's ref as its props shape, not MeshPhysicalMaterial.
  const material = useRef<ComponentRef<typeof MeshTransmissionMaterial>>(null);
  const hover = useRef({ active: false, x: 0, y: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const drag = useRef({
    active: false,
    returning: false,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0,
  });
  const intro = useRef({ frames: 0, time: 0 });
  const introStats = useRef({ frames: 0, ms: 0, worst: 0, logged: false });
  const invalidate = useThree((s) => s.invalidate);
  const glow = useMemo(() => new THREE.Color(), []);
  const localPoint = useMemo(() => new THREE.Vector3(), []);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const quality = useAdaptiveTransmission(adaptiveQuality, params.samples, params.resolution);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  useCursor(hovered || dragging, dragging ? "grabbing" : "grab");

  const extrudeKey = params.extrude
    ? `${params.extrude.depth}:${params.extrude.bevelThickness}:${params.extrude.bevelSize}`
    : "default";

  const geometry = useMemo(() => {
    const base = paths as unknown as LogoPaths;
    if (meshMode === "extrude" && base.extrude && params.extrude) {
      return buildLogoGeometry(
        {
          ...base,
          extrude: {
            ...base.extrude,
            ...params.extrude,
          },
        },
        meshMode,
      );
    }
    return buildLogoGeometry(base, meshMode);
    // extrudeKey tracks nested extrude fields without depending on the whole params object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshMode, extrudeKey]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // Width of the silhouette as the camera sees it, front-facing: the front of the slab sits nearer
  // the camera than z = 0, so its edges project slightly wider than the bounding box. Sizing by this
  // makes the glass logo the width of the flat SVG logo it replaces.
  const modelWidth = useMemo(() => {
    const pos = geometry.getAttribute("position");
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = (pos.getX(i) * CAMERA_Z) / (CAMERA_Z - pos.getZ(i));
      if (x < min) min = x;
      if (x > max) max = x;
    }
    return max - min;
  }, [geometry]);

  // Mirror the static layout: 42vw from 4vw on desktop, centred at up to 80vw on mobile.
  const desktop = size.width >= 768;
  const targetWidth = desktop
    ? viewport.width * 0.42
    : Math.min(viewport.width * 0.8, (viewport.width * 640) / size.width);
  const scale = targetWidth / modelWidth;
  const x = desktop ? -viewport.width / 2 + viewport.width * 0.04 + targetWidth / 2 : 0;

  useEffect(() => {
    invalidate();
    gl.domElement.style.touchAction = "none";
  }, [invalidate, gl]);

  // Redraw after mesh / material param changes without resetting intro spin state.
  useEffect(() => {
    invalidate();
  }, [geometry, params, invalidate]);

  // Drag continues on the window so rotation doesn't stop when the pointer leaves the mesh.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const look = paramsRef.current;
      const pitchMax = look.dragPitchMax;
      const sens = look.dragSensitivity;
      const now = performance.now();
      const dt = Math.max((now - d.lastT) / 1000, 1 / 120);
      const dX = (e.clientY - d.lastY) * sens;
      const dY = (e.clientX - d.lastX) * sens;
      d.rotX = THREE.MathUtils.clamp(d.rotX + dX, -pitchMax, pitchMax);
      d.rotY += dY;
      // Kill pitch momentum at the soft stop so coasting can't flip it vertical.
      if (Math.abs(d.rotX) >= pitchMax - 1e-4) d.velX = 0;
      // Exponential moving average of angular velocity (rad/s).
      const vx = dX / dt;
      const vy = dY / dt;
      d.velX = THREE.MathUtils.lerp(d.velX, vx, 0.45);
      d.velY = THREE.MathUtils.lerp(d.velY, vy, 0.45);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      keepAwake(1.2);
    };
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
      // Keep the demand loop alive through coast + bounce settle.
      keepAwake(8);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [keepAwake]);

  const setHoverFromPoint = (point: THREE.Vector3) => {
    const g = group.current;
    const box = geometry.boundingBox;
    if (!g || !box) return;
    localPoint.copy(point);
    g.worldToLocal(localPoint);
    const nx = THREE.MathUtils.clamp(((localPoint.x - box.min.x) / (box.max.x - box.min.x)) * 2 - 1, -1, 1);
    const ny = THREE.MathUtils.clamp(((localPoint.y - box.min.y) / (box.max.y - box.min.y)) * 2 - 1, -1, 1);
    hover.current.x = nx;
    hover.current.y = ny;
    hover.current.active = true;
  };

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    // Internal glow picks up the still temperature (like liquid-glass.jpg's warm core).
    const mat = material.current as (THREE.MeshPhysicalMaterial & { attenuationColor: THREE.Color }) | null;
    const look = paramsRef.current;
    if (mat?.attenuationColor) {
      glow.copy(tint.current);
      const hsl = { h: 0, s: 0, l: 0 };
      glow.getHSL(hsl);
      glow.setHSL(
        hsl.h,
        Math.min(0.85, hsl.s * look.glowSat),
        THREE.MathUtils.clamp(hsl.l + look.glowLift, look.glowLMin, look.glowLMax),
      );
      mat.attenuationColor.copy(glow);
    }

    // The first frames compile shaders and can stall for a long time, so the intro is
    // driven by capped frame deltas rather than wall-clock time: it always plays in full,
    // just slower on a struggling device. The canvas is only revealed once frames flow.
    const a = intro.current;
    a.frames++;
    if (a.frames === WARMUP_FRAMES) onReady();
    if (a.frames > WARMUP_FRAMES && !introHold) a.time += Math.min(delta, 1 / 30);
    if (a.time < INTRO_END) invalidate();
    const t = a.time;

    // Dev only: how smooth the hero intro really is on this machine (GPU cost can't be seen in a
    // CPU profile). Logged once, when the intro ends.
    if (process.env.NODE_ENV !== "production" && introSlide && a.frames > WARMUP_FRAMES && !introHold) {
      const st = introStats.current;
      if (t < INTRO_END) {
        st.frames++;
        st.ms += delta * 1000;
        st.worst = Math.max(st.worst, delta * 1000);
      } else if (!st.logged && st.frames > 0) {
        st.logged = true;
        console.info(
          `[logo intro] ${st.frames} frames over ${(st.ms / 1000).toFixed(2)}s: ` +
            `${((st.frames * 1000) / st.ms).toFixed(0)} fps avg, worst frame ${st.worst.toFixed(0)} ms`,
        );
      }
    }

    // Start centred and glide to the resting x; `x` is read fresh so resizes stay correct.
    const slide = introSlide ? slideAt(t) : 1;
    g.position.x = x * slide;

    // Wobble only while hovering the logo (and not dragging); ease back to rest on leave.
    const k = 1 - Math.exp(-delta * look.hoverLerp);
    const targetX = hover.current.active && !drag.current.active ? hover.current.y * look.hoverTiltX : 0;
    const targetY = hover.current.active && !drag.current.active ? hover.current.x * look.hoverTiltY : 0;
    tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, targetX, k);
    tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, targetY, k);

    const d = drag.current;
    if (!d.active) {
      // Latch return once coasting is nearly done — don't flip back when the bounce speeds up.
      if (
        !d.returning &&
        Math.abs(d.velX) < DRAG_VELOCITY_EPS &&
        Math.abs(d.velY) < DRAG_VELOCITY_EPS
      ) {
        d.returning = true;
        d.velX = 0;
        d.velY = 0;
        // Don't unwind full turns — spring along the nearest angle to rest.
        d.rotX = shortestAngle(d.rotX);
        d.rotY = shortestAngle(d.rotY);
      }

      if (!d.returning) {
        d.rotX += d.velX * delta;
        d.rotY += d.velY * delta;
        const friction = Math.exp(-look.dragFriction * delta);
        d.velX *= friction;
        d.velY *= friction;
      } else {
        d.velX += (-look.dragSpringPitch * d.rotX - look.dragSpringPitchDamp * d.velX) * delta;
        d.velY += (-look.dragSpring * d.rotY - look.dragSpringDamp * d.velY) * delta;
        d.rotX += d.velX * delta;
        d.rotY += d.velY * delta;
        if (
          Math.abs(d.rotX) < DRAG_ANGLE_EPS &&
          Math.abs(d.rotY) < DRAG_ANGLE_EPS &&
          Math.abs(d.velX) < DRAG_VELOCITY_EPS &&
          Math.abs(d.velY) < DRAG_VELOCITY_EPS
        ) {
          d.rotX = 0;
          d.rotY = 0;
          d.velX = 0;
          d.velY = 0;
          d.returning = false;
        }
      }
      const pitchMax = paramsRef.current.dragPitchMax;
      if (Math.abs(d.rotX) > pitchMax) {
        d.rotX = THREE.MathUtils.clamp(d.rotX, -pitchMax, pitchMax);
        d.velX = 0;
      }
      if (d.velX || d.velY || d.rotX || d.rotY || d.returning) invalidate();
    }

    g.rotation.set(tilt.current.x + d.rotX, (introSlide ? heroSpinAt(t) : spinAt(t)) + tilt.current.y + d.rotY, 0);
    logoPose.current.x = g.rotation.x;
    logoPose.current.y = g.rotation.y;
  });

  return (
    <group ref={group} position={[x, 0, 0]} scale={scale}>
      <mesh
        ref={mesh}
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoverFromPoint(e.point);
          keepAwake(1.2);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (drag.current.active) return;
          setHoverFromPoint(e.point);
          keepAwake(1.2);
        }}
        onPointerOut={() => {
          hover.current.active = false;
          setHovered(false);
          keepAwake(0.6);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const { clientX, clientY } = e.nativeEvent;
          const d = drag.current;
          d.active = true;
          d.returning = false;
          d.lastX = clientX;
          d.lastY = clientY;
          d.lastT = performance.now();
          d.velX = 0;
          d.velY = 0;
          hover.current.active = false;
          setDragging(true);
          setHovered(true);
          keepAwake(2);
        }}
      >
        <MeshTransmissionMaterial
          ref={material}
          // Banding fix stays (blur + dither); CA / env / tint restored for color.
          samples={quality.samples}
          resolution={quality.resolution}
          backside={params.backside}
          backsideEnvMapIntensity={params.backsideEnvMapIntensity}
          dithering
          backsideThickness={params.backsideThickness}
          thickness={params.thickness}
          ior={params.ior}
          chromaticAberration={params.chromaticAberration}
          anisotropicBlur={params.anisotropicBlur}
          distortion={params.distortion}
          distortionScale={params.distortionScale}
          temporalDistortion={0}
          roughness={params.roughness}
          clearcoat={params.clearcoat}
          clearcoatRoughness={params.clearcoatRoughness}
          specularIntensity={params.specularIntensity}
          envMapIntensity={params.envMapIntensity}
          color="#ffffff"
          attenuationColor="#fff6f0"
          attenuationDistance={params.attenuationDistance}
        />
      </mesh>
    </group>
  );
}
