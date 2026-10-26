"use client";

import { Environment, Lightformer, MeshTransmissionMaterial, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const MODEL = "/brand/fiu-logo.glb";
const DRACO = "/draco/";
const BACKDROP_Z = -4;
const CROSSFADE_SECONDS = 1.6;

export type SceneStill = { src: string; width: number; height: number };

/**
 * The live home hero: the rotating stills are drawn into the scene as a backdrop, so the
 * glass logo actually refracts whichever still is behind it.
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
      flat
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 12], fov: 30 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor("#0c0b0d")}
    >
      <Backdrop stills={stills} index={index} />
      <Logo onReady={onReady} />
      {/* Studio for the glass to reflect: white softboxes plus the warm/cool accents of
          the Canva render. Rendered once into an env map. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={6} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[16, 3, 1]} />
        <Lightformer form="rect" intensity={4} position={[-8, 1, 4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={5} color="#ff9a45" position={[8, -1, 3]} rotation-y={-Math.PI / 2} scale={[8, 1.5, 1]} />
        <Lightformer form="rect" intensity={4} color="#7fb0ff" position={[0, -6, 3]} rotation-x={-Math.PI / 2} scale={[14, 2, 1]} />
        <Lightformer form="rect" intensity={3} position={[0, 0, 10]} scale={[10, 10, 1]} />
        <Lightformer form="ring" intensity={8} position={[4, 4, 8]} scale={1.5} />
      </Environment>
    </Canvas>
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

function Backdrop({ stills, index }: { stills: SceneStill[]; index: number }) {
  const textures = useTexture(
    stills.map((s) => s.src),
    (loaded) => {
      for (const t of loaded) {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
      }
    },
  );
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.viewport);
  const keepAwake = useKeepAwake();
  const fade = useRef({ from: index, to: index, start: 0 });

  const material = useRef<THREE.ShaderMaterial>(null);
  const [uniforms] = useState(() => ({
    tFrom: { value: null as THREE.Texture | null },
    tTo: { value: null as THREE.Texture | null },
    fromAspect: { value: 1 },
    toAspect: { value: 1 },
    planeAspect: { value: 1 },
    progress: { value: 1 },
  }));

  // Plane sized to fill the view at its depth.
  const { width, height } = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, BACKDROP_Z));

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
    const u = material.current?.uniforms;
    if (!u) return;
    u.tFrom.value = textures[f.from];
    u.tTo.value = textures[f.to];
    u.fromAspect.value = stills[f.from].width / stills[f.from].height;
    u.toAspect.value = stills[f.to].width / stills[f.to].height;
    u.planeAspect.value = width / height;
    u.progress.value = f.start ? Math.min((performance.now() - f.start) / (CROSSFADE_SECONDS * 1000), 1) : 1;
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

function Logo({ onReady }: { onReady: () => void }) {
  const { nodes } = useGLTF(MODEL, DRACO);
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const keepAwake = useKeepAwake();
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const intro = useRef({ frames: 0, time: 0 });
  const invalidate = useThree((s) => s.invalidate);

  // One merged mesh means one transmission pass per frame instead of one per part.
  const geometry = useMemo(() => {
    const parts = Object.values(nodes)
      .filter((n): n is THREE.Mesh => (n as THREE.Mesh).isMesh)
      .map((mesh) => {
        mesh.updateWorldMatrix(true, false);
        const g = mesh.geometry.clone();
        g.applyMatrix4(mesh.matrixWorld);
        for (const name of Object.keys(g.attributes)) {
          if (name !== "position" && name !== "normal") g.deleteAttribute(name);
        }
        return g;
      });
    const merged = mergeGeometries(parts)!;
    merged.computeBoundingBox();
    merged.center();
    return merged;
  }, [nodes]);

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
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      keepAwake(1.2);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [invalidate, keepAwake]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    // The first frames compile shaders and can stall for a long time, so the intro is
    // driven by capped frame deltas rather than wall-clock time: it always plays in full,
    // just slower on a struggling device. The canvas is only revealed once frames flow.
    const a = intro.current;
    a.frames++;
    if (a.frames === WARMUP_FRAMES) onReady();
    if (a.frames > WARMUP_FRAMES) a.time += Math.min(delta, 1 / 30);
    if (a.time < SPIN_END) invalidate();
    const t = a.time;
    // Gentle parallax toward the pointer, eased independently of frame rate.
    const k = 1 - Math.exp(-delta * 4);
    tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, pointer.current.y * 0.12, k);
    tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, pointer.current.x * 0.18, k);
    g.rotation.set(tilt.current.x, spinAt(t) + tilt.current.y, 0);
  });

  return (
    <group ref={group} position={[x, 0, 0]} scale={scale}>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          samples={6}
          resolution={1024}
          backside
          backsideThickness={1.2}
          thickness={1.6}
          ior={1.6}
          chromaticAberration={0.14}
          anisotropicBlur={0.04}
          distortion={0}
          roughness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          specularIntensity={1}
          envMapIntensity={2.6}
          color="#ffffff"
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL, DRACO);
