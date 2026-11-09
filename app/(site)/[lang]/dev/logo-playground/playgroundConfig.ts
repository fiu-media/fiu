import {
  interactionParamsSchema,
  LOGO_PARAM_PRESETS,
  type LogoGlassParams,
  type LogoInteractionParams,
  type LogoLightsConfig,
  type LogoMaterialParams,
  type LogoMeshMode,
  type LogoRimLook,
} from "@/features/logo";

import {
  formatZodError,
  fullImportSchema,
  interactionImportSchema,
  lightingImportSchema,
  type LogoInteractionConfigExport,
  type LogoLightingConfigExport,
  type LogoMaterialConfigExport,
  type LogoPartialGlassParams,
  type LogoPlaygroundConfig,
  materialImportSchema,
} from "./playgroundSchemas";

const INTERACTION_KEYS = interactionParamsSchema.keyof().options;

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

function fence(lang: string, value: unknown): string {
  return [`\`\`\`${lang}`, JSON.stringify(value, null, 2), "```"].join("\n");
}

function omitKeys<T extends Record<string, unknown>, K extends keyof T>(params: T, keys: readonly K[]): Omit<T, K> {
  const next = { ...params };
  for (const key of keys) delete next[key];
  return next;
}

/** Material / glow / extrude — everything except lights and interaction. */
export function pickMaterialParams(params: LogoGlassParams): LogoMaterialParams {
  const material = omitKeys(params, ["lights", ...INTERACTION_KEYS]);
  return {
    ...material,
    extrude: material.extrude ? { ...material.extrude } : null,
  };
}

export function pickInteractionParams(params: LogoGlassParams): LogoInteractionParams {
  return {
    weight: params.weight,
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
export function coalesceParams(partial: LogoPartialGlassParams, rimLook: LogoRimLook = "light"): LogoGlassParams {
  const base = LOGO_PARAM_PRESETS[rimLook];
  return cloneParams({
    ...base,
    ...partial,
    extrude: partial.extrude !== undefined ? partial.extrude : base.extrude,
    lights: partial.lights ?? base.lights,
  });
}

function extractJsonPayload(text: string): { fence: string | null; raw: string } {
  const fenced = text.match(/```([^\n`]*)\s*([\s\S]*?)```/);
  if (fenced) return { fence: fenced[1].trim() || null, raw: fenced[2].trim() };
  return { fence: null, raw: text.trim() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseFullConfig(json: unknown): { ok: true; config: LogoPlaygroundConfig } | { ok: false; error: string } {
  const result = fullImportSchema.safeParse(json);
  if (!result.success) return { ok: false, error: `Full snapshot: ${formatZodError(result.error)}` };
  const { version, meshMode, rimLook, display, params } = result.data;
  return { ok: true, config: { version, meshMode, rimLook, display, params: coalesceParams(params, rimLook) } };
}

export function parseConfigExport(text: string): LogoPlaygroundConfig | null {
  const json = parseJson(extractJsonPayload(text).raw);
  // Partial section snapshots are handled by importPlaygroundConfig.
  if (!isRecord(json) || json.section) return null;
  const result = parseFullConfig(json);
  return result.ok ? result.config : null;
}

export type LogoImportKind = "full" | "material" | "lighting" | "interaction";

export type LogoImportResult = { ok: true; kind: LogoImportKind; config: LogoPlaygroundConfig } | { ok: false; error: string };

/**
 * Apply a copied full or tab-scoped snapshot onto the current playground config.
 * Partial imports only overwrite their section; full replaces everything.
 */
export function importPlaygroundConfig(current: LogoPlaygroundConfig, text: string): LogoImportResult {
  const { fence, raw } = extractJsonPayload(text);
  if (!raw) return { ok: false, error: "Paste is empty." };

  const obj = parseJson(raw);
  if (obj === undefined) return { ok: false, error: "Could not parse JSON." };
  if (!isRecord(obj)) return { ok: false, error: "Config must be a JSON object." };

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
    const result = materialImportSchema.safeParse(obj);
    if (!result.success) return { ok: false, error: `Material snapshot: ${formatZodError(result.error)}` };
    const { rimLook = current.rimLook, meshMode = current.meshMode, params } = result.data;
    return {
      ok: true,
      kind: "material",
      config: {
        ...current,
        version: 1,
        rimLook,
        meshMode,
        display: "live",
        params: cloneParams({ ...current.params, ...params }),
      },
    };
  }

  if (section === "lighting") {
    const result = lightingImportSchema.safeParse(obj);
    if (!result.success) return { ok: false, error: `Lighting snapshot: ${formatZodError(result.error)}` };
    return {
      ok: true,
      kind: "lighting",
      config: { ...current, version: 1, display: "live", params: cloneParams({ ...current.params, lights: result.data.lights }) },
    };
  }

  if (section === "interaction") {
    const result = interactionImportSchema.safeParse(obj);
    if (!result.success) return { ok: false, error: `Interaction snapshot: ${formatZodError(result.error)}` };
    return {
      ok: true,
      kind: "interaction",
      config: { ...current, version: 1, display: "live", params: cloneParams({ ...current.params, ...result.data.params }) },
    };
  }

  if (section === "full" || (section === null && "params" in obj && "meshMode" in obj)) {
    const result = parseFullConfig(obj);
    return result.ok ? { ok: true, kind: "full", config: result.config } : result;
  }

  return { ok: false, error: "Unrecognized config. Use a fiu-logo-config / material / lighting / interaction snapshot." };
}
