"use client";

import { Effects, Environment, MeshTransmissionMaterial, useCursor, useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree, type ThreeElement } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import paths from "@/public/brand/fiu-logo-paths.json";
import { buildLogoGeometry, type LogoPaths } from "./buildLogoGeometry";

extend({ UnrealBloomPass });

declare module "@react-three/fiber" {
  interface ThreeElements {
    unrealBloomPass: ThreeElement<typeof UnrealBloomPass>;
  }
}

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
 * Logo mesh is built in Three.js from `fiu-logo-paths.json` (rounded extrusion of the
 * white mark + tip-aligned parallelogram diamonds) — no GLB / Blender step for the web.
 *
 * Rendering is on demand. Frames are only drawn while something moves (intro spin,
 * crossfade, pointer parallax), so an idle hero costs nothing.
 */
export default function LogoScene({
  stills,
  index,
  onReady,
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 12], fov: 30 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
      }}
      onCreated={({ gl }) => gl.setClearColor("#0c0b0d")}
    >
      <Scene stills={stills} index={index} onReady={onReady} />
    </Canvas>
  );
}

function Scene({
  stills,
  index,
  onReady,
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
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
      <Backdrop stills={stills} textures={textures} fade={fade} />
      <Logo onReady={onReady} tint={tint} logoPose={logoPose} />
      {/* frames=Infinity: re-bake whenever the demand loop runs (crossfade / parallax),
          so tint tracks the still. Idle canvases don't draw, so this stays cheap. */}
      <Studio tint={tint} logoPose={logoPose} />
      {/* External sparkle: lagged point lights + bloom so streaks trail the spin. */}
      <SparkLights logoPose={logoPose} />
      <SparkBloom />
    </>
  );
}

/** How quickly spark lights catch the logo pose — lower = slower highlight travel. */
const SPARK_FOLLOW = 1.1;

/**
 * Soft fill only — point lights make round specular blobs. Streaks come from
 * elongated env SoftLights + anisotropic transmission instead.
 */
function SparkLights({ logoPose }: { logoPose: MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, logoPose.current.x, SPARK_FOLLOW, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, logoPose.current.y, SPARK_FOLLOW, delta);
  });
  return (
    <group ref={group}>
      <pointLight position={[-1.8, 3.8, 7]} intensity={8} distance={16} decay={2.2} color="#fff8f0" />
      <pointLight position={[2.2, 2.5, 6.5]} intensity={6} distance={14} decay={2.2} color="#ffffff" />
    </group>
  );
}

/** Very soft bloom so streaks glow without round flares. */
function SparkBloom() {
  const { size } = useThree();
  const res = useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height]);
  return (
    <Effects multisamping={0} disableGamma>
      <unrealBloomPass args={[res, 0.08, 0.75, 0.94]} />
    </Effects>
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

// Same cover-fit as CSS object-fit: cover / object-position: center, so the backdrop
// lines up exactly with the <Image> stills underneath the canvas.
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
    <mesh position={[0, 0, BACKDROP_Z]} renderOrder={-1}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={material}
        vertexShader={backdropVertex}
        fragmentShader={backdropFragment}
        uniforms={uniforms}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Dual-key front studio like liquid-glass.jpg: warm still-tinted fill, plus clean
 * white rim/keys for the bright edge catchlights that define the glass.
 */
function Studio({
  tint,
  logoPose,
}: {
  tint: MutableRefObject<THREE.Color>;
  logoPose: MutableRefObject<{ x: number; y: number }>;
}) {
  const follow = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = follow.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, logoPose.current.x, SPARK_FOLLOW, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, logoPose.current.y, SPARK_FOLLOW, delta);
  });
  return (
    <Environment resolution={256} frames={Infinity}>
      <SoftLight tint={tint} mixWhite={0} intensity={1} lift={0.4} position={[0, 0, -7]} scale={14} />
      {/* Still-tinted wrap — world-fixed so body colour stays stable */}
      <SoftLight tint={tint} mixWhite={0.15} intensity={3.2} position={[-2.8, 3.2, 9]} scale={5.5} />
      <SoftLight tint={tint} mixWhite={0.1} intensity={2.6} position={[3, -2, 8.5]} scale={5} />
      <SoftLight tint={tint} mixWhite={0.12} intensity={2.2} position={[0.8, 1.2, 10]} scale={4.5} />
      <SoftLight tint={tint} mixWhite={0.1} intensity={1.6} position={[0, -4, 6.5]} scale={5} />
      {/* Elongated white streak lights — lag with spin; refract as lines inside the tubes */}
      <group ref={follow}>
        <SoftLight tint={tint} mixWhite={1} intensity={3.2} position={[-1.5, 4, 9.5]} scale={[7, 0.35, 1]} streak roll={0.4} />
        <SoftLight tint={tint} mixWhite={1} intensity={2.6} position={[2, 3.2, 9]} scale={[6, 0.3, 1]} streak roll={-0.5} />
        <SoftLight tint={tint} mixWhite={1} intensity={2.4} position={[0.3, 4.6, 8.5]} scale={[5.5, 0.28, 1]} streak roll={0.15} />
        <SoftLight tint={tint} mixWhite={1} intensity={2.2} position={[-2.4, 1.2, 9]} scale={[5, 0.28, 1]} streak roll={1.1} />
        <SoftLight tint={tint} mixWhite={1} intensity={2.0} position={[1.2, -2.2, 8.8]} scale={[4.5, 0.25, 1]} streak roll={-0.9} />
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
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.lookAt(0, 0, 0);
    if (roll) m.rotateZ(roll);
  }, [position, roll]);

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
      <meshBasicMaterial ref={mat} side={THREE.DoubleSide} toneMapped={false} />
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

function Logo({
  onReady,
  tint,
  logoPose,
}: {
  onReady: () => void;
  tint: MutableRefObject<THREE.Color>;
  logoPose: MutableRefObject<{ x: number; y: number }>;
}) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  const keepAwake = useKeepAwake();
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const hover = useRef({ active: false, x: 0, y: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const drag = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    rotX: 0,
    rotY: 0,
  });
  const intro = useRef({ frames: 0, time: 0 });
  const invalidate = useThree((s) => s.invalidate);
  const glow = useMemo(() => new THREE.Color(), []);
  const localPoint = useMemo(() => new THREE.Vector3(), []);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  useCursor(hovered || dragging, dragging ? "grabbing" : "grab");

  const geometry = useMemo(() => buildLogoGeometry(paths as unknown as LogoPaths), []);

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

  // Drag continues on the window so rotation doesn't stop when the pointer leaves the mesh.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      d.rotY += (e.clientX - d.lastX) * DRAG_SENSITIVITY;
      d.rotX += (e.clientY - d.lastY) * DRAG_SENSITIVITY;
      d.rotX = THREE.MathUtils.clamp(d.rotX, -Math.PI / 2, Math.PI / 2);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      keepAwake(1.2);
    };
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
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
    if (mat?.attenuationColor) {
      glow.copy(tint.current);
      // Lift so thick cores glow; keep chroma so it isn't milky white.
      const hsl = { h: 0, s: 0, l: 0 };
      glow.getHSL(hsl);
      glow.setHSL(hsl.h, Math.min(0.85, hsl.s * 1.15), THREE.MathUtils.clamp(hsl.l + 0.12, 0.4, 0.72));
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
          drag.current.active = true;
          drag.current.lastX = clientX;
          drag.current.lastY = clientY;
          hover.current.active = false;
          setDragging(true);
          setHovered(true);
          keepAwake(2);
        }}
      >
        <MeshTransmissionMaterial
          ref={material}
          samples={12}
          resolution={1024}
          backside
          // Sparkles live in the volume only: hot env discs + strong dispersion, no coat.
          backsideThickness={1.55}
          thickness={2.1}
          ior={1.56}
          chromaticAberration={0.55}
          // Stretch bright env streaks along the tubes instead of round blobs.
          anisotropicBlur={0.22}
          distortion={0.16}
          distortionScale={0.5}
          temporalDistortion={0}
          roughness={0.08}
          clearcoat={0.2}
          clearcoatRoughness={0.35}
          specularIntensity={0.3}
          envMapIntensity={2.5}
          color="#ffffff"
          attenuationColor="#ffffff"
          attenuationDistance={2.8}
        />
      </mesh>
    </group>
  );
}
