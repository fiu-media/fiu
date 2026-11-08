export type { LogoMeshMode } from "./buildLogoGeometry";
export type { LightSweep, SweepAxis, SweepTechnique } from "./lightSweep";
export { sweepCssTime } from "./lightSweep";
export type {
  LogoDisplayMode,
  LogoExtrudeOverride,
  LogoGlassParams,
  LogoImportKind,
  LogoPlaygroundConfig,
  LogoPointLightConfig,
  LogoRimLook,
  LogoSoftLightConfig,
} from "./logoConfig";
export {
  formatConfigExport,
  formatInteractionConfigExport,
  formatLightingConfigExport,
  formatMaterialConfigExport,
  importPlaygroundConfig,
  LOGO_PARAM_PRESETS,
  presetConfig,
  resetInteractionParams,
  resetLightingParams,
  resetMaterialParams,
} from "./logoConfig";
export type { ConfigDiff, DiffEntry, DiffGroup, DiffValue } from "./logoDiff";
export { DIFF_GROUP_LABELS, DIFF_GROUP_ORDER, diffConfigs } from "./logoDiff";
export type { LogoPerfStats } from "./logoPerf";
export { costVsPreset } from "./logoPerf";
export type { LogoDecision, LogoTier } from "./logoTier";
export { decideLogoTier, rememberTooSlow } from "./logoTier";
