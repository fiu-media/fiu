import { MeshTransmissionMaterial } from "@react-three/drei";
import type { ComponentRef, RefObject } from "react";

import type { LogoGlassParams } from "../config/schemas";

// drei types MeshTransmissionMaterial's ref as its props shape, not MeshPhysicalMaterial.
export type GlassMaterialRef = ComponentRef<typeof MeshTransmissionMaterial>;

/** The logo's liquid-glass material, set from the look's parameters. */
export function GlassMaterial({ params, ref }: { params: LogoGlassParams; ref: RefObject<GlassMaterialRef | null> }) {
  return (
    <MeshTransmissionMaterial
      ref={ref}
      // Banding fix stays (blur + dither); CA / env / tint restored for color.
      samples={params.samples}
      // No `resolution`: drei then sizes the transmission buffers to the canvas (with its
      // pixel ratio). A number makes them square, which squashes the wide viewport into it and
      // leaves horizontal detail well under one buffer pixel per screen pixel on desktop.
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
  );
}
