import type { LogoMeshMode } from "./buildLogoGeometry";

/** Bevel/rim look: `light` lifts charcoal edges; `dark` keeps liquid-glass ink bands. */
export type LogoRimLook = "light" | "dark";

/** Playground display: live WebGL glass vs white PNG fallback. */
export type LogoDisplayMode = "live" | "fallback";

export type LogoExtrudeOverride = {
  depth: number;
  bevelThickness: number;
  bevelSize: number;
};

/** Env softbox / streak (rendered inside drei Environment). */
export type LogoSoftLightConfig = {
  id: string;
  label: string;
  enabled: boolean;
  /** When true, light rides the logo pose (sparkle streaks/cores). */
  followPose: boolean;
  kind: "disc" | "streak";
  /** Feathered falloff (key softboxes). */
  feather: boolean;
  x: number;
  y: number;
  z: number;
  /** Uniform scale for discs; streak uses scaleX/scaleY as plane size. */
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  intensity: number;
  mixWhite: number;
  lift: number;
  /** Radians around look-at axis (streaks). */
  roll: number;
};

/** Scene point lights (specular fill outside the env map). */
export type LogoPointLightConfig = {
  id: string;
  label: string;
  enabled: boolean;
  followPose: boolean;
  x: number;
  y: number;
  z: number;
  intensity: number;
  distance: number;
  decay: number;
  color: string;
};

export type LogoLightsConfig = {
  soft: LogoSoftLightConfig[];
  points: LogoPointLightConfig[];
};

/** Tunable glass / studio / glow params (what the playground edits). */
export type LogoGlassParams = {
  backsideThickness: number;
  thickness: number;
  ior: number;
  chromaticAberration: number;
  anisotropicBlur: number;
  distortion: number;
  distortionScale: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  specularIntensity: number;
  envMapIntensity: number;
  backsideEnvMapIntensity: number;
  attenuationDistance: number;
  samples: number;
  resolution: number;
  glowSat: number;
  glowLift: number;
  glowLMin: number;
  glowLMax: number;
  /** When set, overrides paths JSON extrude depth/bevel for extrude mesh mode. */
  extrude: LogoExtrudeOverride | null;
  dragPitchMax: number;
  lights: LogoLightsConfig;
};

export type LogoPlaygroundConfig = {
  version: 1;
  meshMode: LogoMeshMode;
  rimLook: LogoRimLook;
  display: LogoDisplayMode;
  params: LogoGlassParams;
};

function soft(
  partial: Omit<LogoSoftLightConfig, "feather" | "followPose" | "roll" | "lift" | "scaleZ"> &
    Partial<Pick<LogoSoftLightConfig, "feather" | "followPose" | "roll" | "lift" | "scaleZ">>,
): LogoSoftLightConfig {
  return {
    feather: false,
    followPose: false,
    roll: 0,
    lift: 1,
    scaleZ: 1,
    ...partial,
  };
}

function point(partial: LogoPointLightConfig): LogoPointLightConfig {
  return partial;
}

const SHARED_SOFT: LogoSoftLightConfig[] = [
  soft({
    id: "key",
    label: "Key softbox",
    enabled: true,
    kind: "disc",
    feather: true,
    x: -2.2,
    y: 3,
    z: 9.5,
    scaleX: 13,
    scaleY: 13,
    scaleZ: 13,
    intensity: 2.4,
    mixWhite: 0.08,
  }),
  soft({
    id: "fill",
    label: "Fill softbox",
    enabled: true,
    kind: "disc",
    feather: true,
    x: 2.6,
    y: -2,
    z: 9,
    scaleX: 12,
    scaleY: 12,
    scaleZ: 12,
    intensity: 1.8,
    mixWhite: 0.05,
  }),
  soft({
    id: "streak-a",
    label: "Streak A",
    enabled: true,
    followPose: true,
    kind: "streak",
    x: -1.5,
    y: 4,
    z: 9.5,
    scaleX: 6,
    scaleY: 0.55,
    scaleZ: 1,
    intensity: 7,
    mixWhite: 1,
    roll: 0.4,
  }),
  soft({
    id: "streak-b",
    label: "Streak B",
    enabled: true,
    followPose: true,
    kind: "streak",
    x: 0.3,
    y: 4.6,
    z: 8.5,
    scaleX: 5,
    scaleY: 0.45,
    scaleZ: 1,
    intensity: 5.5,
    mixWhite: 1,
    roll: 0.15,
  }),
  soft({
    id: "streak-c",
    label: "Streak C",
    enabled: true,
    followPose: true,
    kind: "streak",
    x: -2.4,
    y: 1.2,
    z: 9,
    scaleX: 4.5,
    scaleY: 0.45,
    scaleZ: 1,
    intensity: 5,
    mixWhite: 1,
    roll: 1.1,
  }),
  soft({
    id: "streak-d",
    label: "Streak D",
    enabled: true,
    followPose: true,
    kind: "streak",
    x: 1.2,
    y: 4.2,
    z: 8.8,
    scaleX: 4,
    scaleY: 0.4,
    scaleZ: 1,
    intensity: 4.5,
    mixWhite: 1,
    roll: -0.35,
  }),
  soft({
    id: "core-a",
    label: "Hot core A",
    enabled: true,
    followPose: true,
    kind: "disc",
    x: -1.2,
    y: 3.5,
    z: 10,
    scaleX: 0.7,
    scaleY: 0.7,
    scaleZ: 0.7,
    intensity: 14,
    mixWhite: 1,
  }),
  soft({
    id: "core-b",
    label: "Hot core B",
    enabled: true,
    followPose: true,
    kind: "disc",
    x: 0.6,
    y: 4.2,
    z: 9.8,
    scaleX: 0.5,
    scaleY: 0.5,
    scaleZ: 0.5,
    intensity: 11,
    mixWhite: 1,
  }),
  soft({
    id: "core-c",
    label: "Hot core C",
    enabled: true,
    followPose: true,
    kind: "disc",
    x: -2.0,
    y: 0.6,
    z: 9.2,
    scaleX: 0.45,
    scaleY: 0.45,
    scaleZ: 0.45,
    intensity: 10,
    mixWhite: 1,
  }),
];

const SHARED_POINTS: LogoPointLightConfig[] = [
  point({
    id: "spark-a",
    label: "Point A",
    enabled: true,
    followPose: true,
    x: -1.8,
    y: 3.8,
    z: 7,
    intensity: 28,
    distance: 16,
    decay: 2.2,
    color: "#fff8f0",
  }),
  point({
    id: "spark-b",
    label: "Point B",
    enabled: true,
    followPose: true,
    x: -0.4,
    y: 2.8,
    z: 6.5,
    intensity: 18,
    distance: 14,
    decay: 2.2,
    color: "#ffffff",
  }),
  point({
    id: "spark-c",
    label: "Point C",
    enabled: true,
    followPose: true,
    x: 0.5,
    y: -1.8,
    z: 6,
    intensity: 16,
    distance: 12,
    decay: 2.2,
    color: "#ffffff",
  }),
];

function lightsFor(rimLook: LogoRimLook): LogoLightsConfig {
  const rear =
    rimLook === "light"
      ? soft({
          id: "rear",
          label: "Rear fill",
          enabled: true,
          kind: "disc",
          x: 0,
          y: 0,
          z: -7,
          scaleX: 14,
          scaleY: 14,
          scaleZ: 14,
          intensity: 1.6,
          mixWhite: 0.35,
          lift: 0.65,
        })
      : soft({
          id: "rear",
          label: "Rear fill",
          enabled: true,
          kind: "disc",
          x: 0,
          y: 0,
          z: -7,
          scaleX: 14,
          scaleY: 14,
          scaleZ: 14,
          intensity: 0.8,
          mixWhite: 0,
          lift: 0.35,
        });

  const sidesEnabled = rimLook === "light";
  const sides: LogoSoftLightConfig[] = [
    soft({
      id: "side-left",
      label: "Side left",
      enabled: sidesEnabled,
      kind: "disc",
      x: -9,
      y: 1.5,
      z: 2,
      scaleX: 10,
      scaleY: 10,
      scaleZ: 10,
      intensity: 2.2,
      mixWhite: 0.55,
      lift: 0.7,
    }),
    soft({
      id: "side-right",
      label: "Side right",
      enabled: sidesEnabled,
      kind: "disc",
      x: 9,
      y: 0.5,
      z: 2,
      scaleX: 10,
      scaleY: 10,
      scaleZ: 10,
      intensity: 2.0,
      mixWhite: 0.55,
      lift: 0.7,
    }),
    soft({
      id: "side-top",
      label: "Side top",
      enabled: sidesEnabled,
      kind: "disc",
      x: 0,
      y: 8,
      z: 1,
      scaleX: 11,
      scaleY: 11,
      scaleZ: 11,
      intensity: 1.6,
      mixWhite: 0.5,
      lift: 0.65,
    }),
    soft({
      id: "side-bottom",
      label: "Side bottom",
      enabled: sidesEnabled,
      kind: "disc",
      x: 0,
      y: -8,
      z: 1,
      scaleX: 10,
      scaleY: 10,
      scaleZ: 10,
      intensity: 1.3,
      mixWhite: 0.45,
      lift: 0.6,
    }),
  ];

  return {
    soft: [rear, ...sides, ...SHARED_SOFT.map((l) => ({ ...l }))],
    points: SHARED_POINTS.map((l) => ({ ...l })),
  };
}

const LIGHT_PARAMS: LogoGlassParams = {
  backsideThickness: 0.9,
  thickness: 1.2,
  ior: 1.48,
  chromaticAberration: 0.62,
  anisotropicBlur: 0.42,
  distortion: 0.1,
  distortionScale: 0.4,
  roughness: 0.1,
  clearcoat: 0.45,
  clearcoatRoughness: 0.2,
  specularIntensity: 0.6,
  envMapIntensity: 2.5,
  backsideEnvMapIntensity: 1.85,
  attenuationDistance: 5.8,
  samples: 10,
  resolution: 768,
  glowSat: 1.08,
  glowLift: 0.2,
  glowLMin: 0.52,
  glowLMax: 0.8,
  extrude: { depth: 0.16, bevelThickness: 0.12, bevelSize: 0.12 },
  dragPitchMax: 0.4,
  lights: lightsFor("light"),
};

const DARK_PARAMS: LogoGlassParams = {
  backsideThickness: 1.55,
  thickness: 2.1,
  ior: 1.56,
  chromaticAberration: 0.7,
  anisotropicBlur: 0.38,
  distortion: 0.14,
  distortionScale: 0.4,
  roughness: 0.06,
  clearcoat: 0.6,
  clearcoatRoughness: 0.12,
  specularIntensity: 0.7,
  envMapIntensity: 2.35,
  backsideEnvMapIntensity: 1,
  attenuationDistance: 2.6,
  samples: 10,
  resolution: 768,
  glowSat: 1.15,
  glowLift: 0.12,
  glowLMin: 0.4,
  glowLMax: 0.72,
  extrude: null,
  dragPitchMax: 0.4,
  lights: lightsFor("dark"),
};

export const LOGO_PARAM_PRESETS: Record<LogoRimLook, LogoGlassParams> = {
  light: LIGHT_PARAMS,
  dark: DARK_PARAMS,
};

export function cloneLights(lights: LogoLightsConfig): LogoLightsConfig {
  return {
    soft: lights.soft.map((l) => ({ ...l })),
    points: lights.points.map((l) => ({ ...l })),
  };
}

export function cloneParams(params: LogoGlassParams): LogoGlassParams {
  return {
    ...params,
    extrude: params.extrude ? { ...params.extrude } : null,
    lights: cloneLights(params.lights),
  };
}

export function presetConfig(rimLook: LogoRimLook, meshMode: LogoMeshMode = "extrude"): LogoPlaygroundConfig {
  return {
    version: 1,
    meshMode,
    rimLook,
    display: "live",
    params: cloneParams(LOGO_PARAM_PRESETS[rimLook]),
  };
}

const CONFIG_FENCE = "fiu-logo-config";
const MATERIAL_FENCE = "fiu-logo-material";
const LIGHTING_FENCE = "fiu-logo-lighting";

export type LogoMaterialParams = Omit<LogoGlassParams, "lights">;

export type LogoMaterialConfigExport = {
  version: 1;
  section: "material";
  rimLook: LogoRimLook;
  meshMode: LogoMeshMode;
  params: LogoMaterialParams;
};

export type LogoLightingConfigExport = {
  version: 1;
  section: "lighting";
  rimLook: LogoRimLook;
  lights: LogoLightsConfig;
};

function fence(lang: string, value: unknown): string {
  return [`\`\`\`${lang}`, JSON.stringify(value, null, 2), "```"].join("\n");
}

/** Material / glow / extrude / drag — everything except lights. */
export function pickMaterialParams(params: LogoGlassParams): LogoMaterialParams {
  const { lights: _lights, ...rest } = params;
  return {
    ...rest,
    extrude: rest.extrude ? { ...rest.extrude } : null,
  };
}

/** Reset material fields from the rim preset; keep current lights. */
export function resetMaterialParams(params: LogoGlassParams, rimLook: LogoRimLook): LogoGlassParams {
  return {
    ...pickMaterialParams(LOGO_PARAM_PRESETS[rimLook]),
    lights: cloneLights(params.lights),
  };
}

/** Reset lights from the rim preset; keep current material fields. */
export function resetLightingParams(params: LogoGlassParams, rimLook: LogoRimLook): LogoGlassParams {
  return {
    ...params,
    extrude: params.extrude ? { ...params.extrude } : null,
    lights: cloneLights(LOGO_PARAM_PRESETS[rimLook].lights),
  };
}

/** Markdown/JSON snapshot of the current playground settings. */
export function formatConfigExport(config: LogoPlaygroundConfig): string {
  return fence(CONFIG_FENCE, config);
}

export function formatMaterialConfigExport(config: LogoPlaygroundConfig): string {
  const payload: LogoMaterialConfigExport = {
    version: 1,
    section: "material",
    rimLook: config.rimLook,
    meshMode: config.meshMode,
    params: pickMaterialParams(config.params),
  };
  return fence(MATERIAL_FENCE, payload);
}

export function formatLightingConfigExport(config: LogoPlaygroundConfig): string {
  const payload: LogoLightingConfigExport = {
    version: 1,
    section: "lighting",
    rimLook: config.rimLook,
    lights: cloneLights(config.params.lights),
  };
  return fence(LIGHTING_FENCE, payload);
}

export function parseConfigExport(text: string): LogoPlaygroundConfig | null {
  const fenced = text.match(/```(?:fiu-logo-config|json)\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  try {
    const parsed = JSON.parse(raw) as LogoPlaygroundConfig;
    if (parsed?.version !== 1 || !parsed.params || !parsed.meshMode) return null;
    // Older snapshots without lights — fill from the rim preset.
    if (!parsed.params.lights) {
      parsed.params.lights = cloneLights(LOGO_PARAM_PRESETS[parsed.rimLook ?? "light"].lights);
    }
    return parsed;
  } catch {
    return null;
  }
}
