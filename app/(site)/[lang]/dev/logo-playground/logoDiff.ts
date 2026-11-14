import type { LogoExtrudeOverride } from "@/features/logo";

import { pickInteractionParams } from "./playgroundConfig";
import type { LogoPlaygroundConfig } from "./playgroundSchemas";

export type DiffGroup = "config" | "material" | "glow" | "extrude" | "interaction" | "lighting";

export const DIFF_GROUP_ORDER: DiffGroup[] = ["config", "material", "glow", "extrude", "interaction", "lighting"];

export const DIFF_GROUP_LABELS: Record<DiffGroup, string> = {
  config: "Config",
  material: "Material",
  glow: "Glow / attenuation",
  extrude: "Extrude geometry",
  interaction: "Interaction",
  lighting: "Lighting",
};

export type DiffValue = string | number | boolean | null;

export type DiffEntry = {
  group: DiffGroup;
  /** Lights only: the light the field belongs to, so rows can be grouped under it. */
  subject: string | null;
  path: string;
  label: string;
  kind: "changed" | "added" | "removed";
  before: DiffValue;
  after: DiffValue;
  /** Signed `after - before` when both sides are numbers. */
  delta: number | null;
};

export type ConfigDiff = {
  entries: DiffEntry[];
  /** Fields compared that were identical on both sides. */
  unchanged: number;
};

/** A light by id and label, with all of its fields by name for the key-by-key walk. */
type LightFields = { id: string; label: string; fields: Record<string, unknown> };

const EPSILON = 1e-9;
const GLOW_KEYS = new Set<string>(["glowSat", "glowLift", "glowLMin", "glowLMax"]);
const SKIPPED_PARAM_KEYS = new Set<string>(["lights", "extrude"]);
const SKIPPED_LIGHT_KEYS = new Set<string>(["id", "label"]);

/** `chromaticAberration` -> `Chromatic aberration`. */
function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= EPSILON;
  return a === b;
}

function toDiffValue(value: unknown): DiffValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") return value;
  // Not a primitive, so it only needs a readable stand-in in the diff list.
  return JSON.stringify(value);
}

function describeExtrude(extrude: LogoExtrudeOverride | null): string {
  if (!extrude) return "off";
  return `${extrude.depth} / ${extrude.bevelThickness} / ${extrude.bevelSize}`;
}

/** An object's own fields by name, for comparing two of them key by key. */
function fieldsOf(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value));
}

const lightFields = (lights: readonly { id: string; label: string }[]): LightFields[] =>
  lights.map((light) => ({ id: light.id, label: light.label, fields: fieldsOf(light) }));

function unionKeys(a: object, b: object): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])];
}

function unionById<T extends { id: string }>(base: T[], next: T[]) {
  const nextById = new Map(next.map((l) => [l.id, l]));
  const baseIds = new Set(base.map((l) => l.id));
  return [
    ...base.map((l) => ({ id: l.id, before: l, after: nextById.get(l.id) })),
    ...next.filter((l) => !baseIds.has(l.id)).map((l) => ({ id: l.id, before: undefined, after: l })),
  ];
}

/**
 * Field-by-field comparison of two playground configs. Lights are matched by `id`
 * (not array index), so reordering never shows up as a change.
 * `labels` overrides the humanised field names (e.g. with the slider labels).
 */
export function diffConfigs(
  base: LogoPlaygroundConfig,
  next: LogoPlaygroundConfig,
  labels: Record<string, string> = {},
): ConfigDiff {
  const entries: DiffEntry[] = [];
  let unchanged = 0;

  const labelFor = (key: string) => labels[key] ?? humanize(key);

  const compare = (
    group: DiffGroup,
    path: string,
    label: string,
    before: unknown,
    after: unknown,
    subject: string | null = null,
  ) => {
    if (sameValue(before, after)) {
      unchanged++;
      return;
    }
    const b = toDiffValue(before);
    const a = toDiffValue(after);
    entries.push({
      group,
      subject,
      path,
      label,
      kind: "changed",
      before: b,
      after: a,
      delta: typeof b === "number" && typeof a === "number" ? a - b : null,
    });
  };

  for (const key of ["meshMode", "rimLook", "display"] as const) {
    compare("config", key, labelFor(key), base[key], next[key]);
  }

  const bp = fieldsOf(base.params);
  const np = fieldsOf(next.params);
  const interactionKeys = new Set<string>(Object.keys(pickInteractionParams(base.params)));

  for (const key of unionKeys(bp, np)) {
    if (SKIPPED_PARAM_KEYS.has(key)) continue;
    const group: DiffGroup = interactionKeys.has(key) ? "interaction" : GLOW_KEYS.has(key) ? "glow" : "material";
    compare(group, `params.${key}`, labelFor(key), bp[key], np[key]);
  }

  const be = base.params.extrude;
  const ne = next.params.extrude;
  if (be && ne) {
    const bx = fieldsOf(be);
    const nx = fieldsOf(ne);
    for (const key of unionKeys(bx, nx)) {
      compare("extrude", `params.extrude.${key}`, labelFor(key), bx[key], nx[key]);
    }
  } else if (be || ne) {
    entries.push({
      group: "extrude",
      subject: null,
      path: "params.extrude",
      label: "Extrude override",
      kind: "changed",
      before: describeExtrude(be),
      after: describeExtrude(ne),
      delta: null,
    });
  } else {
    unchanged++;
  }

  const compareLights = (kind: "soft" | "points", noun: string) => {
    const pairs = unionById(lightFields(base.params.lights[kind]), lightFields(next.params.lights[kind]));
    for (const { id, before, after } of pairs) {
      const prefix = `params.lights.${kind}.${id}`;
      if (!before || !after) {
        const present = before ?? after;
        entries.push({
          group: "lighting",
          subject: present.label,
          path: prefix,
          label: noun,
          kind: after ? "added" : "removed",
          before: null,
          after: null,
          delta: null,
        });
        continue;
      }
      for (const key of unionKeys(before.fields, after.fields)) {
        if (SKIPPED_LIGHT_KEYS.has(key)) continue;
        compare("lighting", `${prefix}.${key}`, humanize(key), before.fields[key], after.fields[key], after.label);
      }
    }
  };

  compareLights("soft", "Soft light");
  compareLights("points", "Point light");

  return { entries, unchanged };
}
