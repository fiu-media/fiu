import { z } from "zod";

const LOGO_MESH_MODES = ["tubes", "extrude"] as const;
export const meshModeSchema = z.enum(LOGO_MESH_MODES);
export type LogoMeshMode = z.infer<typeof meshModeSchema>;

/** Bevel/rim look: `light` lifts charcoal edges; `dark` keeps liquid-glass ink bands. */
export const rimLookSchema = z.enum(["light", "dark"]);
export type LogoRimLook = z.infer<typeof rimLookSchema>;

const extrudeSchema = z.object({
  depth: z.number(),
  bevelThickness: z.number(),
  bevelSize: z.number(),
});
export type LogoExtrudeOverride = z.infer<typeof extrudeSchema>;

/** Env softbox / streak (rendered inside drei Environment). Missing flags fall back to the `soft()` defaults. */
const softLightSchema = z.object({
  id: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  /** When true, light rides the logo pose (sparkle streaks/cores). */
  followPose: z.boolean().default(false),
  kind: z.enum(["disc", "streak"]),
  /** Feathered falloff (key softboxes). */
  feather: z.boolean().default(false),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  /** Uniform scale for discs; streak uses scaleX/scaleY as plane size. */
  scaleX: z.number(),
  scaleY: z.number(),
  scaleZ: z.number().default(1),
  intensity: z.number(),
  mixWhite: z.number(),
  lift: z.number().default(1),
  /** Radians around look-at axis (streaks). */
  roll: z.number().default(0),
});
export type LogoSoftLightConfig = z.infer<typeof softLightSchema>;

/** Scene point lights (specular fill outside the env map). */
const pointLightSchema = z.object({
  id: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  followPose: z.boolean(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  intensity: z.number(),
  distance: z.number(),
  decay: z.number(),
  color: z.string(),
});
export type LogoPointLightConfig = z.infer<typeof pointLightSchema>;

export const lightsSchema = z.object({
  soft: z.array(softLightSchema),
  points: z.array(pointLightSchema),
});
export type LogoLightsConfig = z.infer<typeof lightsSchema>;

export const interactionParamsSchema = z.object({
  /** Inertia multiplier: 1 = the baseline feel, >1 heavier (slower to turn, coast and return). */
  weight: z.number(),
  dragPitchMax: z.number(),
  dragSensitivity: z.number(),
  hoverTiltX: z.number(),
  hoverTiltY: z.number(),
  /** Hover return rate (higher = snappier). */
  hoverLerp: z.number(),
  dragFriction: z.number(),
  dragSpring: z.number(),
  dragSpringDamp: z.number(),
  dragSpringPitch: z.number(),
  dragSpringPitchDamp: z.number(),
});
export type LogoInteractionParams = z.infer<typeof interactionParamsSchema>;

export const materialParamsSchema = z.object({
  backsideThickness: z.number(),
  thickness: z.number(),
  ior: z.number(),
  chromaticAberration: z.number(),
  anisotropicBlur: z.number(),
  distortion: z.number(),
  distortionScale: z.number(),
  roughness: z.number(),
  clearcoat: z.number(),
  clearcoatRoughness: z.number(),
  specularIntensity: z.number(),
  envMapIntensity: z.number(),
  backsideEnvMapIntensity: z.number(),
  attenuationDistance: z.number(),
  samples: z.number(),
  glowSat: z.number(),
  glowLift: z.number(),
  glowLMin: z.number(),
  glowLMax: z.number(),
  /** When set, overrides paths JSON extrude depth/bevel for extrude mesh mode. */
  extrude: extrudeSchema.nullable(),
  /** Double-sided transmission pass — richer rims, roughly 2× the FBO cost. */
  backside: z.boolean(),
});
export type LogoMaterialParams = z.infer<typeof materialParamsSchema>;

/** Tunable glass / studio / glow params (what the playground edits). */
export const glassParamsSchema = materialParamsSchema.extend(interactionParamsSchema.shape).extend({
  lights: lightsSchema,
});
export type LogoGlassParams = z.infer<typeof glassParamsSchema>;
