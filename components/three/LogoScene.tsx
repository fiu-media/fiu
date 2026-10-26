"use client";

import { Center, MeshTransmissionMaterial, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Group, Mesh, SRGBColorSpace, Texture, TextureLoader } from "three";

const GLB = "/brand/fiu-logo.glb";

type SceneProps = {
  /** Still URL so transmission glass can refract the same backdrop as the page. */
  backdropSrc?: string;
  reduceMotion?: boolean;
  onReady?: () => void;
};

function useBackdropTexture(src?: string) {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const loader = new TextureLoader();
    loader.load(src, (t) => {
      if (cancelled) return;
      t.colorSpace = SRGBColorSpace;
      setTex(t);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);
  return tex;
}

function LogoModel({
  backdrop,
  reduceMotion,
  onReady,
}: {
  backdrop: Texture | null;
  reduceMotion: boolean;
  onReady?: () => void;
}) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(GLB, true);

  // Bake each mesh's world transform into a cloned geometry so we can re-home
  // under <Center> without losing relative placement of strokes vs gems.
  const geometries = useMemo(() => {
    scene.updateMatrixWorld(true);
    const list: { key: string; geometry: Mesh["geometry"] }[] = [];
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      list.push({ key: mesh.uuid, geometry });
    });
    return list;
  }, [scene]);

  useLayoutEffect(() => {
    onReady?.();
  }, [onReady, geometries]);

  useFrame((_, delta) => {
    if (!group.current || reduceMotion) return;
    group.current.rotation.y += delta * 0.18;
  });

  return (
    <Center ref={group}>
      <group>
        {geometries.map(({ key, geometry }) => (
          <mesh key={key} geometry={geometry}>
            <MeshTransmissionMaterial
              backside
              samples={6}
              resolution={512}
              transmission={1}
              thickness={0.65}
              roughness={0.05}
              ior={1.5}
              chromaticAberration={0.035}
              anisotropicBlur={0.2}
              distortion={0.08}
              distortionScale={0.15}
              temporalDistortion={0.08}
              clearcoat={1}
              clearcoatRoughness={0.05}
              background={backdrop ?? undefined}
              color="#ffffff"
            />
          </mesh>
        ))}
      </group>
    </Center>
  );
}

function SceneBody({ backdropSrc, reduceMotion = false, onReady }: SceneProps) {
  const backdrop = useBackdropTexture(backdropSrc);
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#fff2e8" />
      <directionalLight position={[-5, 2, 3]} intensity={0.5} color="#ff6a40" />
      <hemisphereLight args={["#ffe8d8", "#1a0508", 0.55]} />
      <LogoModel backdrop={backdrop} reduceMotion={reduceMotion} onReady={onReady} />
    </>
  );
}

export function LogoScene(props: SceneProps) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full touch-none"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.5], fov: 32, near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Suspense fallback={null}>
        <SceneBody {...props} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(GLB, true);
