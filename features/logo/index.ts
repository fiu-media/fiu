export { LOGO_PARAM_PRESETS } from "./config/presets";
export type {
  LogoGlassParams,
  LogoInteractionParams,
  LogoLightsConfig,
  LogoMaterialParams,
  LogoPointLightConfig,
  LogoRimLook,
  LogoSoftLightConfig,
} from "./config/schemas";
export type { LogoExtrudeOverride, LogoMeshMode } from "./config/schemas";
export {
  glassParamsSchema,
  interactionParamsSchema,
  lightsSchema,
  materialParamsSchema,
  meshModeSchema,
  rimLookSchema,
} from "./config/schemas";
export type { LightSweep, SweepAxis, SweepTechnique } from "./lightSweep";
export { sweepCssTime } from "./lightSweep";
export type { LogoPerfStats } from "./logoPerf";
export { costVsPreset } from "./logoPerf";
export type { LogoDecision, LogoTier } from "./logoTier";
export { decideLogoTier, rememberTooSlow } from "./logoTier";
