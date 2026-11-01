import { describe, expect, it } from "vitest";
import {
  formatConfigExport,
  formatInteractionConfigExport,
  formatLightingConfigExport,
  formatMaterialConfigExport,
  importPlaygroundConfig,
  parseConfigExport,
  presetConfig,
} from "./logoConfig";

const current = presetConfig("light");

describe("parseConfigExport", () => {
  it("round-trips a fenced export", () => {
    const parsed = parseConfigExport(formatConfigExport(presetConfig("dark")));
    expect(parsed).toMatchObject({ version: 1, rimLook: "dark", meshMode: "extrude" });
  });

  it("accepts bare JSON", () => {
    const parsed = parseConfigExport(JSON.stringify(presetConfig("light")));
    expect(parsed?.version).toBe(1);
  });

  it("fills params missing from older snapshots", () => {
    const old = { version: 1, meshMode: "extrude", rimLook: "light", params: {} };
    expect(parseConfigExport(JSON.stringify(old))?.params.lights).toEqual(current.params.lights);
  });

  it.each(["", "nope", "{}", JSON.stringify({ version: 2, meshMode: "extrude", params: {} }), JSON.stringify({ version: 1, section: "material", meshMode: "extrude", params: {} })])(
    "returns null for %j",
    (text) => {
      expect(parseConfigExport(text)).toBeNull();
    },
  );
});

describe("importPlaygroundConfig", () => {
  it("rejects an empty paste and invalid JSON", () => {
    expect(importPlaygroundConfig(current, "  ")).toEqual({ ok: false, error: "Paste is empty." });
    expect(importPlaygroundConfig(current, "{oops")).toEqual({ ok: false, error: "Could not parse JSON." });
    expect(importPlaygroundConfig(current, "[1]")).toMatchObject({ ok: false });
    expect(importPlaygroundConfig(current, "5")).toMatchObject({ ok: false });
  });

  it("imports a full snapshot", () => {
    const result = importPlaygroundConfig(current, formatConfigExport(presetConfig("dark")));
    expect(result).toMatchObject({ ok: true, kind: "full", config: { rimLook: "dark" } });
  });

  it.each([
    ["material", formatMaterialConfigExport],
    ["lighting", formatLightingConfigExport],
    ["interaction", formatInteractionConfigExport],
  ] as const)("imports a %s snapshot onto the current config", (kind, format) => {
    const result = importPlaygroundConfig(current, format(presetConfig("light")));
    expect(result).toMatchObject({ ok: true, kind, config: { version: 1, display: "live" } });
  });

  it("only overwrites the section a partial snapshot covers", () => {
    const dark = presetConfig("dark");
    const result = importPlaygroundConfig(current, formatLightingConfigExport(dark));
    if (!result.ok) throw new Error(result.error);
    expect(result.config.params.lights).toEqual(dark.params.lights);
    expect(result.config.rimLook).toBe(current.rimLook);
  });

  it("reports a partial snapshot with its payload missing", () => {
    expect(importPlaygroundConfig(current, JSON.stringify({ section: "material" }))).toMatchObject({ ok: false });
    expect(importPlaygroundConfig(current, JSON.stringify({ section: "lighting" }))).toMatchObject({ ok: false });
    expect(importPlaygroundConfig(current, JSON.stringify({ section: "interaction" }))).toMatchObject({ ok: false });
  });

  it("explains an unrecognised snapshot", () => {
    expect(importPlaygroundConfig(current, JSON.stringify({ section: "other" }))).toMatchObject({ ok: false });
    expect(importPlaygroundConfig(current, "```mystery\n{}\n```")).toMatchObject({ ok: false });
  });
});
