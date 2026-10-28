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
  glowSat: number;
  glowLift: number;
  glowLMin: number;
  glowLMax: number;
  /** When set, overrides paths JSON extrude depth/bevel for extrude mesh mode. */
  extrude: LogoExtrudeOverride | null;
  /** Double-sided transmission pass — richer rims, roughly 2× the FBO cost. */
  backside: boolean;
  dragPitchMax: number;
  dragSensitivity: number;
  hoverTiltX: number;
  hoverTiltY: number;
  /** Hover return rate (higher = snappier). */
  hoverLerp: number;
  dragFriction: number;
  dragSpring: number;
  dragSpringDamp: number;
  dragSpringPitch: number;
  dragSpringPitchDamp: number;
  lights: LogoLightsConfig;
};

export type LogoInteractionParams = {
  dragPitchMax: number;
  dragSensitivity: number;
  hoverTiltX: number;
  hoverTiltY: number;
  hoverLerp: number;
  dragFriction: number;
  dragSpring: number;
  dragSpringDamp: number;
  dragSpringPitch: number;
  dragSpringPitchDamp: number;
};

const INTERACTION_DEFAULTS: LogoInteractionParams = {
  dragPitchMax: 0.4,
  dragSensitivity: 0.005,
  hoverTiltX: 0.12,
  hoverTiltY: 0.18,
  hoverLerp: 4,
  dragFriction: 2.4,
  dragSpring: 55,
  dragSpringDamp: 4.2,
  dragSpringPitch: 72,
  dragSpringPitchDamp: 5.2,
};

const INTERACTION_KEYS = Object.keys(INTERACTION_DEFAULTS) as (keyof LogoInteractionParams)[];

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
  backsideThickness: 1,
  thickness: 0.55,
  ior: 1.49,
  chromaticAberration: 0.68,
  anisotropicBlur: 0.18,
  distortion: 0.43,
  distortionScale: 1,
  roughness: 0,
  clearcoat: 0.22,
  clearcoatRoughness: 0,
  specularIntensity: 0.1,
  envMapIntensity: 2.5,
  backsideEnvMapIntensity: 1.85,
  attenuationDistance: 5.8,
  samples: 24,
  glowSat: 0.77,
  glowLift: 0,
  glowLMin: 0.52,
  glowLMax: 0.88,
  extrude: { depth: 0.5, bevelThickness: 0.25, bevelSize: 0.235 },
  backside: true,
  ...INTERACTION_DEFAULTS,
  dragSensitivity: 0.0065,
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
  samples: 6,
  glowSat: 1.15,
  glowLift: 0.12,
  glowLMin: 0.4,
  glowLMax: 0.72,
  extrude: null,
  backside: true,
  ...INTERACTION_DEFAULTS,
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
const INTERACTION_FENCE = "fiu-logo-interaction";

export type LogoMaterialParams = Omit<LogoGlassParams, "lights" | keyof LogoInteractionParams>;

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

export type LogoInteractionConfigExport = {
  version: 1;
  section: "interaction";
  rimLook: LogoRimLook;
  params: LogoInteractionParams;
};

function fence(lang: string, value: unknown): string {
  return [`\`\`\`${lang}`, JSON.stringify(value, null, 2), "```"].join("\n");
}

function omitInteraction<T extends Record<string, unknown>>(params: T): Omit<T, keyof LogoInteractionParams> {
  const next = { ...params };
  for (const key of INTERACTION_KEYS) delete next[key];
  return next;
}

/** Material / glow / extrude — everything except lights and interaction. */
export function pickMaterialParams(params: LogoGlassParams): LogoMaterialParams {
  const { lights: _lights, ...rest } = params;
  const material = omitInteraction(rest);
  return {
    ...material,
    extrude: material.extrude ? { ...material.extrude } : null,
  };
}

export function pickInteractionParams(params: LogoGlassParams): LogoInteractionParams {
  return {
    dragPitchMax: params.dragPitchMax,
    dragSensitivity: params.dragSensitivity,
    hoverTiltX: params.hoverTiltX,
    hoverTiltY: params.hoverTiltY,
    hoverLerp: params.hoverLerp,
    dragFriction: params.dragFriction,
    dragSpring: params.dragSpring,
    dragSpringDamp: params.dragSpringDamp,
    dragSpringPitch: params.dragSpringPitch,
    dragSpringPitchDamp: params.dragSpringPitchDamp,
  };
}

/** Reset material fields from the rim preset; keep lights + interaction. */
export function resetMaterialParams(params: LogoGlassParams, rimLook: LogoRimLook): LogoGlassParams {
  return {
    ...pickMaterialParams(LOGO_PARAM_PRESETS[rimLook]),
    ...pickInteractionParams(params),
    lights: cloneLights(params.lights),
  };
}

/** Reset lights from the rim preset; keep material + interaction. */
export function resetLightingParams(params: LogoGlassParams, rimLook: LogoRimLook): LogoGlassParams {
  return {
    ...params,
    extrude: params.extrude ? { ...params.extrude } : null,
    lights: cloneLights(LOGO_PARAM_PRESETS[rimLook].lights),
  };
}

/** Reset interaction fields from the rim preset; keep material + lights. */
export function resetInteractionParams(params: LogoGlassParams, rimLook: LogoRimLook): LogoGlassParams {
  return {
    ...params,
    extrude: params.extrude ? { ...params.extrude } : null,
    lights: cloneLights(params.lights),
    ...pickInteractionParams(LOGO_PARAM_PRESETS[rimLook]),
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

export function formatInteractionConfigExport(config: LogoPlaygroundConfig): string {
  const payload: LogoInteractionConfigExport = {
    version: 1,
    section: "interaction",
    rimLook: config.rimLook,
    params: pickInteractionParams(config.params),
  };
  return fence(INTERACTION_FENCE, payload);
}

/** Fill missing param keys from the rim preset (older playground snapshots). */
export function coalesceParams(partial: LogoGlassParams, rimLook: LogoRimLook = "light"): LogoGlassParams {
  const base = LOGO_PARAM_PRESETS[rimLook];
  return cloneParams({
    ...base,
    ...partial,
    extrude: partial.extrude !== undefined ? (partial.extrude ? { ...partial.extrude } : null) : base.extrude,
    lights: partial.lights ? cloneLights(partial.lights) : cloneLights(base.lights),
  });
}

function extractJsonPayload(text: string): { fence: string | null; raw: string } {
  const fenced = text.match(/```([^\n`]*)\s*([\s\S]*?)```/);
  if (fenced) return { fence: fenced[1].trim() || null, raw: fenced[2].trim() };
  return { fence: null, raw: text.trim() };
}

export function parseConfigExport(text: string): LogoPlaygroundConfig | null {
  const { raw } = extractJsonPayload(text);
  try {
    const parsed = JSON.parse(raw) as LogoPlaygroundConfig;
    if (parsed?.version !== 1 || !parsed.params || !parsed.meshMode) return null;
    // Partial section snapshots are handled by importPlaygroundConfig.
    if ((parsed as { section?: string }).section) return null;
    parsed.params = coalesceParams(parsed.params, parsed.rimLook ?? "light");
    return parsed;
  } catch {
    return null;
  }
}

export type LogoImportKind = "full" | "material" | "lighting" | "interaction";

export type LogoImportResult =
  | { ok: true; kind: LogoImportKind; config: LogoPlaygroundConfig }
  | { ok: false; error: string };

/**
 * Apply a copied full or tab-scoped snapshot onto the current playground config.
 * Partial imports only overwrite their section; full replaces everything.
 */
export function importPlaygroundConfig(current: LogoPlaygroundConfig, text: string): LogoImportResult {
  const { fence, raw } = extractJsonPayload(text);
  if (!raw) return { ok: false, error: "Paste is empty." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Could not parse JSON." };
  }

  if (!parsed || typeof parsed !== "object") return { ok: false, error: "Config must be a JSON object." };
  const obj = parsed as Record<string, unknown>;
  const section =
    typeof obj.section === "string"
      ? obj.section
      : fence === MATERIAL_FENCE
        ? "material"
        : fence === LIGHTING_FENCE
          ? "lighting"
          : fence === INTERACTION_FENCE
            ? "interaction"
            : fence === CONFIG_FENCE || fence === "json" || !fence
              ? "full"
              : null;

  if (section === "material") {
    const slice = obj as Partial<LogoMaterialConfigExport>;
    if (!slice.params || typeof slice.params !== "object") {
      return { ok: false, error: "Material snapshot is missing params." };
    }
    const rimLook = (slice.rimLook ?? current.rimLook) as LogoRimLook;
    const meshMode = (slice.meshMode ?? current.meshMode) as LogoMeshMode;
    const merged = coalesceParams(
      {
        ...pickMaterialParams(current.params),
        ...(slice.params as LogoMaterialParams),
        ...pickInteractionParams(current.params),
        lights: current.params.lights,
      } as LogoGlassParams,
      rimLook,
    );
    return {
      ok: true,
      kind: "material",
      config: {
        ...current,
        version: 1,
        rimLook,
        meshMode,
        display: "live",
        params: {
          ...merged,
          ...pickInteractionParams(current.params),
          lights: cloneLights(current.params.lights),
        },
      },
    };
  }

  if (section === "lighting") {
    const slice = obj as Partial<LogoLightingConfigExport>;
    if (!slice.lights || typeof slice.lights !== "object") {
      return { ok: false, error: "Lighting snapshot is missing lights." };
    }
    return {
      ok: true,
      kind: "lighting",
      config: {
        ...current,
        version: 1,
        display: "live",
        params: {
          ...current.params,
          extrude: current.params.extrude ? { ...current.params.extrude } : null,
          lights: cloneLights(slice.lights as LogoLightsConfig),
        },
      },
    };
  }

  if (section === "interaction") {
    const slice = obj as Partial<LogoInteractionConfigExport>;
    if (!slice.params || typeof slice.params !== "object") {
      return { ok: false, error: "Interaction snapshot is missing params." };
    }
    return {
      ok: true,
      kind: "interaction",
      config: {
        ...current,
        version: 1,
        display: "live",
        params: {
          ...current.params,
          extrude: current.params.extrude ? { ...current.params.extrude } : null,
          lights: cloneLights(current.params.lights),
          ...pickInteractionParams({
            ...INTERACTION_DEFAULTS,
            ...(slice.params as LogoInteractionParams),
          } as LogoGlassParams),
        },
      },
    };
  }

  if (section === "full" || (!obj.section && obj.params && obj.meshMode)) {
    const full = parseConfigExport(raw) ?? parseConfigExport(text);
    if (!full) return { ok: false, error: "Full snapshot needs version, meshMode, and params." };
    return { ok: true, kind: "full", config: { ...full, display: full.display ?? "live" } };
  }

  return { ok: false, error: "Unrecognized config. Use a fiu-logo-config / material / lighting / interaction snapshot." };
}
