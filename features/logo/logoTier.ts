import { z } from "zod";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { safeStorage } from "@/lib/safe-storage";

import type { LogoGlassParams } from "./config/schemas";

/**
 * How much glass a device gets. `high` is the full preset; `medium` and `low` trade samples,
 * chromatic aberration, the backside pass and pixel ratio for frame rate. `static` is the flat
 * white SVG: below the floor the glass costs more than it shows.
 *
 * No three.js imports here: the home hero reads this before it decides whether to load the scene.
 */
export type LogoTier = "high" | "medium" | "low";
export type LogoDecision = LogoTier | "static";

const TIERS: readonly LogoTier[] = ["high", "medium", "low"];

/** The floor: the cheapest tier has to hold this behind the splash, or the hero shows the SVG. */
const MIN_LIVE_FPS = 24;
/** At or above this the probe keeps the tier; between the floor and this it drops one. */
const SMOOTH_FPS = 45;
/** After the intro: the cheapest tier staying under this for `FLOOR_SECONDS` swaps in the SVG. */
export const MIDSESSION_FLOOR_FPS = 15;
export const FLOOR_SECONDS = 3;
/** Frames drawn (and thrown away) before measuring: the first ones compile shaders. */
export const PROBE_WARMUP_FRAMES = 3;
export const PROBE_FRAMES = 12;
/**
 * The probe stops early once its frames add up to this (twice what `PROBE_FRAMES` take at the floor),
 * as long as it has `PROBE_MIN_FRAMES`: a median of five still shrugs off a late shader compile.
 */
const PROBE_BUDGET_MS = (2 * PROBE_FRAMES * 1000) / MIN_LIVE_FPS;
const PROBE_MIN_FRAMES = 5;

/** Whether a probe has seen enough frames to judge. */
export function probeComplete(frameMs: readonly number[]) {
  if (frameMs.length >= PROBE_FRAMES) return true;
  return frameMs.length >= PROBE_MIN_FRAMES && frameMs.reduce((sum, ms) => sum + ms, 0) >= PROBE_BUDGET_MS;
}

type TierSettings = {
  /** Cap on the preset's sample count (drei bakes it into the shader, so a change recompiles). */
  maxSamples: number;
  /** Uniforms, so switching them is free. Chromatic aberration triples the refraction lookups. */
  chromaticAberration: boolean;
  /** The backside pass is a whole extra render of the scene. */
  backside: boolean;
  dpr: number | [number, number];
  /** Fixed for the life of the canvas, so only the starting tier sets these two. */
  antialias: boolean;
  envResolution: number;
};

export const TIER_SETTINGS: Record<LogoTier, TierSettings> = {
  high: { maxSamples: Infinity, chromaticAberration: true, backside: true, dpr: [1, 1.5], antialias: true, envResolution: 256 },
  medium: { maxSamples: 12, chromaticAberration: true, backside: true, dpr: [1, 1.25], antialias: true, envResolution: 256 },
  low: { maxSamples: 6, chromaticAberration: false, backside: false, dpr: 1, antialias: false, envResolution: 128 },
};

export function applyLogoTier(params: LogoGlassParams, tier: LogoTier): LogoGlassParams {
  if (tier === "high") return params;
  const s = TIER_SETTINGS[tier];
  return {
    ...params,
    samples: Math.min(params.samples, s.maxSamples),
    chromaticAberration: s.chromaticAberration ? params.chromaticAberration : 0,
    backside: s.backside && params.backside,
  };
}

export function lowerTier(tier: LogoTier): LogoTier | null {
  return TIERS[TIERS.indexOf(tier) + 1] ?? null;
}

export function higherTier(tier: LogoTier, ceiling: LogoTier): LogoTier | null {
  const i = TIERS.indexOf(tier);
  return i > TIERS.indexOf(ceiling) ? TIERS[i - 1]! : null;
}

export type DeviceInfo = {
  webgl2: boolean;
  /** WebGL2 only comes with `failIfMajorPerformanceCaveat` off, i.e. the browser would render in software. */
  performanceCaveat: boolean;
  renderer: string | null;
  /** GB, Chromium only (rounded down to 0.25, 0.5, 1, 2, 4 or 8). */
  deviceMemory?: number;
  cores?: number;
  saveData: boolean;
};

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/** The starting tier from what the browser says about the device. The probe behind the splash has the final word. */
export function tierFromDevice(info: DeviceInfo): LogoDecision {
  if (!info.webgl2 || info.performanceCaveat) return "static";
  if (info.renderer && SOFTWARE_RENDERER.test(info.renderer)) return "static";
  const memory = info.deviceMemory ?? Infinity;
  const cores = info.cores ?? Infinity;
  if (memory < 2) return "static";
  if (memory <= 2 || cores <= 2 || info.saveData) return "low";
  if (memory <= 4 || cores <= 4) return "medium";
  return "high";
}

export function medianFps(frameMs: readonly number[]): number {
  const sorted = [...frameMs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const ms = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  return ms > 0 ? 1000 / ms : Infinity;
}

/**
 * What to do with a probe of `frameMs` at `tier`: keep it, drop one tier, jump to `low` and probe
 * again, or give up on the glass. The median shrugs off a hitch or two from hydration.
 */
export function probeVerdict(frameMs: readonly number[], tier: LogoTier): { next: LogoDecision; reprobe: boolean } {
  const fps = medianFps(frameMs);
  if (fps >= SMOOTH_FPS) return { next: tier, reprobe: false };
  if (fps >= MIN_LIVE_FPS) return { next: lowerTier(tier) ?? tier, reprobe: false };
  if (tier !== "low") return { next: "low", reprobe: true };
  return { next: "static", reprobe: false };
}

// Only a verdict of "too slow" is remembered: it is the one that saves a download (the 3D bundle),
// and it is clear-cut. Which live tier a device gets is close-run on capable hardware (one cold load
// can read a little slow), so the probe decides that afresh on every visit, behind the splash.
// Bump the version whenever the tiers change, so an old verdict doesn't stick.
const STORAGE_KEY = "fiu:logo-tier:v2";
export const STORED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DECISIONS: readonly LogoDecision[] = [...TIERS, "static"];

function isDecision(value: unknown): value is LogoDecision {
  return DECISIONS.includes(value as LogoDecision);
}

/** When this device was found too slow, as stored: anything malformed reads as no verdict. */
export const tooSlowSchema = z.number().nullable().catch(null);

/** Whether a verdict from `at` still stands at `now`. */
export function isTooSlowFresh(at: number | null, now: number): boolean {
  return at !== null && at <= now && now - at <= STORED_TTL_MS;
}

// Read from storage when the module loads, which is synchronous; the server has no storage, so there it stays null.
const tooSlowStore = createStore<{ at: number | null }>()(
  persist(() => ({ at: null as number | null }), {
    name: STORAGE_KEY,
    version: 1,
    storage: createJSONStorage(() => safeStorage),
    merge: (persisted, current) => ({
      ...current,
      at: tooSlowSchema.parse((persisted as { at?: unknown } | undefined)?.at),
    }),
  }),
);

let cached: LogoDecision | undefined;

/** The glass was too slow here: show the SVG for the rest of this page load (a remounted hero too) and for a week after. */
export function rememberTooSlow() {
  cached = "static";
  tooSlowStore.setState({ at: Date.now() });
}

function readDeviceInfo(): DeviceInfo {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const base = {
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
    saveData: Boolean(nav.connection?.saveData),
  };
  try {
    let gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    const performanceCaveat = !gl;
    gl ??= document.createElement("canvas").getContext("webgl2");
    if (!gl) return { ...base, webgl2: false, performanceCaveat: false, renderer: null };
    let renderer = String(gl.getParameter(gl.RENDERER));
    // Chromium reports a generic name here; the real one sits behind the debug extension. Firefox
    // already reports it (and warns if the extension is asked for), so only ask when it's generic.
    if (/^webkit webgl$/i.test(renderer)) {
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      if (debug) renderer = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ...base, webgl2: true, performanceCaveat, renderer };
  } catch {
    return { ...base, webgl2: false, performanceCaveat: false, renderer: null };
  }
}

/**
 * The tier the home hero starts at, worked out once per page load. `?logo=high|medium|low|static`
 * forces one (for testing); otherwise the SVG if an earlier visit found the glass too slow,
 * otherwise the device's own description of itself.
 */
export function decideLogoTier(): LogoDecision {
  if (cached === undefined) {
    const forced = new URLSearchParams(window.location.search).get("logo");
    cached = isDecision(forced)
      ? forced
      : isTooSlowFresh(tooSlowStore.getState().at, Date.now())
        ? "static"
        : tierFromDevice(readDeviceInfo());
  }
  return cached;
}
