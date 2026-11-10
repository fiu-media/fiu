import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useRef, useState } from "react";
import * as THREE from "three";

import { SPLASH_FADE_MS } from "@/features/home/splash-config";
import { at } from "@/lib/at";

import { backdropFragment, backdropVertex } from "./shaders";
import { BACKDROP_Z, CROSSFADE_SECONDS, type Fade } from "./shared";
import type { SceneStill } from "./stills";

/**
 * Hero intro: the glass starts out refracting a bright white field, so it reads as the white
 * splash logo it replaces, then clears to the photo. Above 1 because ACES tone mapping pulls
 * a plain 1.0 down to light grey.
 */
const SPLASH_WHITE = 1.5;
// The refracted field goes white → photo over exactly the splash fade (ease-out, same curve as
// the CSS), so the glass clears as the splash lifts; a slower curve left a white glass logo
// hanging around after the backdrop had gone.
const REVEAL_SECONDS = SPLASH_FADE_MS / 1000;

/** Set a uniform by name; the material's `uniforms` record is untyped, so a lookup can miss. */
function setUniform(uniforms: Record<string, THREE.IUniform>, name: string, value: unknown) {
  const uniform = uniforms[name];
  if (uniform) uniform.value = value;
}

export function Backdrop({
  stills,
  textures,
  fade,
  splashLift,
}: {
  stills: SceneStill[];
  /** `undefined` while a still is still streaming in; the backdrop shows whichever side has loaded. */
  textures: (THREE.Texture | undefined)[];
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
    if (!u) return;
    const ready = textures[f.to] ?? textures[f.from] ?? textures.find(Boolean);
    if (!ready) return;
    setUniform(u, "tFrom", textures[f.from] ?? ready);
    setUniform(u, "tTo", textures[f.to] ?? ready);
    setUniform(u, "fromAspect", at(stills, f.from).width / at(stills, f.from).height);
    setUniform(u, "toAspect", at(stills, f.to).width / at(stills, f.to).height);
    setUniform(u, "planeAspect", width / height);
    setUniform(u, "progress", f.start ? Math.min((performance.now() - f.start) / (CROSSFADE_SECONDS * 1000), 1) : 1);

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
    setUniform(u, "reveal", reveal);
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
