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
const CROSSFADE_SECONDS = 1.6;
const SAMPLE_SIZE = 32;
const NEUTRAL_TINT = new THREE.Color("#c8c4c0");

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
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
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
  return (
    <Canvas
      frameloop={measurePerf ? "always" : "demand"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 12], fov: 30 }}
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
      <Scene stills={stills} index={index} onReady={onReady} meshMode={meshMode} params={params} />
      {measurePerf && onPerf ? <PerfSampler onPerf={onPerf} /> : null}
    </Canvas>
  );
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
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
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
  const keepAwake = useKeepAwake();
  const fade = useRef<Fade>({ from: index, to: index, start: 0 });
  const tint = useRef(NEUTRAL_TINT.clone());
  // Logo orientation — spark lights lag behind this so highlights crawl on spin.
  const logoPose = useRef({ x: 0, y: 0 });

  const tints = useMemo(
    () => stills.map((still, i) => resolveStillTint(still, textures[i])),
    [stills, textures],
  );

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
      <Backdrop stills={stills} textures={textures} fade={fade} />
      <Logo onReady={onReady} tint={tint} logoPose={logoPose} meshMode={meshMode} params={params} />
      {/* Disable still layer after MTM's FBO capture so the main/bloom pass is logo-only. */}
      <BackdropLayerGate phase="afterTransmission" />
      {/* frames=Infinity: re-bake whenever the demand loop runs (crossfade / parallax),
          so tint tracks the still. Idle canvases don't draw, so this stays cheap. */}
      <Studio tint={tint} logoPose={logoPose} params={params} />
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
  useFrame(() => {
    if (performance.now() < until.current) invalidate();
  });
  return useCallback(
    (seconds: number) => {
      until.current = Math.max(until.current, performance.now() + seconds * 1000);
      invalidate();
    },
    [invalidate],
  );
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
  gl_FragColor = mix(a, b, smoothstep(0.0, 1.0, progress));
  #include <colorspace_fragment>
}`;

function Backdrop({
  stills,
  textures,
  fade,
}: {
  stills: SceneStill[];
  textures: THREE.Texture[];
  fade: RefObject<Fade>;
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
  }));

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
}: {
  tint: MutableRefObject<THREE.Color>;
  logoPose: MutableRefObject<{ x: number; y: number }>;
  params: LogoGlassParams;
}) {
  const follow = useRef<THREE.Group>(null);
  const feather = useFeatherMap();
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
    <Environment resolution={256} frames={Infinity}>
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
        <ringGeometry args={[0.22, 0.5, 64]} />
      ) : (
        <ringGeometry args={[0, 0.5, 64]} />
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

const DRAG_SENSITIVITY = 0.005;
const HOVER_TILT_X = 0.12;
const HOVER_TILT_Y = 0.18;
/** Velocity decay after release (higher = stops sooner). */
const DRAG_FRICTION = 2.4;
/** Underdamped return spring — low damping so it overshoots once, then settles. */
const DRAG_SPRING = 55;
const DRAG_SPRING_DAMP = 4.2;
/** Pitch returns a bit harder so vertical lean doesn't linger. */
const DRAG_SPRING_PITCH = 72;
const DRAG_SPRING_PITCH_DAMP = 5.2;
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
}: {
  onReady: () => void;
  tint: MutableRefObject<THREE.Color>;
  logoPose: MutableRefObject<{ x: number; y: number }>;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
}) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  const keepAwake = useKeepAwake();
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
  const invalidate = useThree((s) => s.invalidate);
  const glow = useMemo(() => new THREE.Color(), []);
  const localPoint = useMemo(() => new THREE.Vector3(), []);
  const paramsRef = useRef(params);
  paramsRef.current = params;
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

  const modelWidth = useMemo(() => {
    const box = geometry.boundingBox!;
    return box.max.x - box.min.x;
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
      const pitchMax = paramsRef.current.dragPitchMax;
      const now = performance.now();
      const dt = Math.max((now - d.lastT) / 1000, 1 / 120);
      const dX = (e.clientY - d.lastY) * DRAG_SENSITIVITY;
      const dY = (e.clientX - d.lastX) * DRAG_SENSITIVITY;
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
    if (a.frames > WARMUP_FRAMES) a.time += Math.min(delta, 1 / 30);
    if (a.time < SPIN_END) invalidate();
    const t = a.time;

    // Wobble only while hovering the logo (and not dragging); ease back to rest on leave.
    const k = 1 - Math.exp(-delta * 4);
    const targetX = hover.current.active && !drag.current.active ? hover.current.y * HOVER_TILT_X : 0;
    const targetY = hover.current.active && !drag.current.active ? hover.current.x * HOVER_TILT_Y : 0;
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
        const friction = Math.exp(-DRAG_FRICTION * delta);
        d.velX *= friction;
        d.velY *= friction;
      } else {
        d.velX += (-DRAG_SPRING_PITCH * d.rotX - DRAG_SPRING_PITCH_DAMP * d.velX) * delta;
        d.velY += (-DRAG_SPRING * d.rotY - DRAG_SPRING_DAMP * d.velY) * delta;
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

    g.rotation.set(tilt.current.x + d.rotX, spinAt(t) + tilt.current.y + d.rotY, 0);
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
          samples={params.samples}
          resolution={params.resolution}
          backside
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
