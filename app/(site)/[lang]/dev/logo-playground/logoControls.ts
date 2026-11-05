import { LOGO_PARAM_PRESETS, type LogoExtrudeOverride, type LogoGlassParams } from "@/components/three/logoConfig";

type NumericParamKey = {
  [K in keyof LogoGlassParams]: LogoGlassParams[K] extends number ? K : never;
}[keyof LogoGlassParams];

export type SliderRange = { label: string; min: number; max: number; step: number };

export type SliderDef = SliderRange & { key: NumericParamKey };

export const MATERIAL_SLIDERS: SliderDef[] = [
  { key: "thickness", label: "Thickness", min: 0.2, max: 4, step: 0.05 },
  { key: "backsideThickness", label: "Backside thickness", min: 0.2, max: 3, step: 0.05 },
  { key: "ior", label: "IOR", min: 1.1, max: 2.2, step: 0.01 },
  { key: "chromaticAberration", label: "Chromatic aberration", min: 0, max: 1.2, step: 0.01 },
  { key: "anisotropicBlur", label: "Anisotropic blur", min: 0, max: 1, step: 0.01 },
  { key: "distortion", label: "Distortion", min: 0, max: 0.5, step: 0.01 },
  { key: "distortionScale", label: "Distortion scale", min: 0, max: 1, step: 0.01 },
  { key: "roughness", label: "Roughness", min: 0, max: 0.5, step: 0.01 },
  { key: "clearcoat", label: "Clearcoat", min: 0, max: 1, step: 0.01 },
  { key: "clearcoatRoughness", label: "Clearcoat roughness", min: 0, max: 1, step: 0.01 },
  { key: "specularIntensity", label: "Specular", min: 0, max: 2, step: 0.05 },
  { key: "envMapIntensity", label: "Env map", min: 0, max: 5, step: 0.05 },
  { key: "backsideEnvMapIntensity", label: "Backside env", min: 0, max: 4, step: 0.05 },
  { key: "attenuationDistance", label: "Attenuation distance", min: 0.5, max: 12, step: 0.1 },
  { key: "samples", label: "Samples", min: 4, max: 32, step: 1 },
];

export const GLOW_SLIDERS: SliderDef[] = [
  { key: "glowSat", label: "Glow sat mult", min: 0.5, max: 2, step: 0.01 },
  { key: "glowLift", label: "Glow lift", min: 0, max: 0.5, step: 0.01 },
  { key: "glowLMin", label: "Glow L min", min: 0.1, max: 0.9, step: 0.01 },
  { key: "glowLMax", label: "Glow L max", min: 0.3, max: 1, step: 0.01 },
];

export const INTERACTION_SLIDERS: SliderDef[] = [
  { key: "dragPitchMax", label: "Drag pitch max (rad)", min: 0.1, max: 1.2, step: 0.01 },
  { key: "dragSensitivity", label: "Drag sensitivity", min: 0.001, max: 0.02, step: 0.0005 },
  { key: "hoverTiltX", label: "Hover tilt X", min: 0, max: 0.4, step: 0.01 },
  { key: "hoverTiltY", label: "Hover tilt Y", min: 0, max: 0.5, step: 0.01 },
  { key: "hoverLerp", label: "Hover snappiness", min: 1, max: 12, step: 0.5 },
  { key: "dragFriction", label: "Coast friction", min: 0.5, max: 8, step: 0.1 },
  { key: "dragSpring", label: "Yaw return spring", min: 10, max: 120, step: 1 },
  { key: "dragSpringDamp", label: "Yaw return damp", min: 1, max: 16, step: 0.1 },
  { key: "dragSpringPitch", label: "Pitch return spring", min: 10, max: 140, step: 1 },
  { key: "dragSpringPitchDamp", label: "Pitch return damp", min: 1, max: 16, step: 0.1 },
];

export const EXTRUDE_SLIDERS: (SliderRange & { key: keyof LogoExtrudeOverride })[] = [
  { key: "depth", label: "Extrude depth", min: 0.05, max: 0.5, step: 0.01 },
  { key: "bevelThickness", label: "Bevel thickness", min: 0.02, max: 0.25, step: 0.005 },
  { key: "bevelSize", label: "Bevel size", min: 0.02, max: 0.25, step: 0.005 },
];

/** Extrude override values used when the override is switched on with nothing stored. */
export const DEFAULT_EXTRUDE: LogoExtrudeOverride = LOGO_PARAM_PRESETS.light.extrude ?? {
  depth: 0.16,
  bevelThickness: 0.12,
  bevelSize: 0.12,
};

export const DIFF_LABELS: Record<string, string> = {
  meshMode: "Mesh",
  rimLook: "Rim preset",
  display: "Display",
  backside: "Backside transmission",
  ...Object.fromEntries(
    [...MATERIAL_SLIDERS, ...GLOW_SLIDERS, ...INTERACTION_SLIDERS, ...EXTRUDE_SLIDERS].map((s) => [s.key, s.label]),
  ),
};
