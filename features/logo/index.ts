export type { LogoMeshMode } from "./buildLogoGeometry";
export { sweepCssTime } from "./lightSweep";
export type { LightSweep, SweepAxis, SweepTechnique } from "./lightSweep";
export {
  LOGO_PARAM_PRESETS,
  formatConfigExport,
  formatInteractionConfigExport,
  formatLightingConfigExport,
  formatMaterialConfigExport,
  importPlaygroundConfig,
  presetConfig,
  resetInteractionParams,
  resetLightingParams,
  resetMaterialParams,
} from "./logoConfig";
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
export { DIFF_GROUP_LABELS, DIFF_GROUP_ORDER, diffConfigs } from "./logoDiff";
export type { ConfigDiff, DiffEntry, DiffGroup, DiffValue } from "./logoDiff";
export { costVsPreset } from "./logoPerf";
export type { LogoPerfStats } from "./logoPerf";
export { decideLogoTier, rememberTooSlow } from "./logoTier";
export type { LogoDecision, LogoTier } from "./logoTier";
