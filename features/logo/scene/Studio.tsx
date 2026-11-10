import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { LogoGlassParams } from "../config/schemas";
import { CROSSFADE_SECONDS, type Fade } from "./shared";

/** How quickly spark lights catch the logo pose — lower = slower highlight travel. */
const SPARK_FOLLOW = 1.1;

/**
 * Soft fill only — point lights make round specular blobs. Streaks come from
 * elongated env SoftLights + anisotropic transmission instead.
 */
export function SparkLights({
  logoPose,
  lights,
}: {
  logoPose: RefObject<{ x: number; y: number }>;
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

/**
 * Env portal frames: Infinity while the scene is moving (tint / pose), else 1 so the
 * cubemap freezes. Playground passes envAlways to keep scrubbing live.
 */
function useEnvFrames(fade: RefObject<Fade>, awakeRef: RefObject<boolean>, sweepLive: RefObject<boolean>, envAlways: boolean) {
  const [frames, setFrames] = useState<number>(Infinity);
  const liveRef = useRef(true);
  useFrame(() => {
    const f = fade.current;
    const fading = Boolean(f.start) && performance.now() - f.start < CROSSFADE_SECONDS * 1000;
    const live = envAlways || awakeRef.current || sweepLive.current || fading;
    if (live === liveRef.current) return;
    liveRef.current = live;
    setFrames(live ? Infinity : 1);
  });
  return frames;
}

/** Radial alpha falloff so softboxes don't hard-cut at the rim. */
function useFeatherMap() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser has no 2D canvas");
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
export function Studio({
  tint,
  logoPose,
  params,
  fade,
  awakeRef,
  sweepLive,
  sweepGroup,
  envRotation,
  envAlways,
  envResolution,
}: {
  tint: RefObject<THREE.Color>;
  logoPose: RefObject<{ x: number; y: number }>;
  params: LogoGlassParams;
  fade: RefObject<Fade>;
  awakeRef: RefObject<boolean>;
  sweepLive: RefObject<boolean>;
  sweepGroup: RefObject<THREE.Group | null>;
  envRotation: THREE.Euler;
  envAlways: boolean;
  /** Fixed per canvas: a new size would rebuild the cube render target. */
  envResolution: number;
}) {
  const follow = useRef<THREE.Group>(null);
  const feather = useFeatherMap();
  const frames = useEnvFrames(fade, awakeRef, sweepLive, envAlways);
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
    <Environment resolution={envResolution} frames={frames} environmentRotation={envRotation}>
      <group ref={sweepGroup}>
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
  tint: RefObject<THREE.Color>;
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
  feather?: THREE.Texture | undefined;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Color(), []);

  const [px, py, pz] = position;
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.lookAt(0, 0, 0);
    if (roll) m.rotateZ(roll);
  }, [px, py, pz, roll]);

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
        {...(feather ? { map: feather } : {})}
        transparent={Boolean(feather)}
        depthWrite={false}
      />
    </mesh>
  );
}
