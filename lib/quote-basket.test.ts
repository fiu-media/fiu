import { describe, expect, it } from "vitest";
import { clampQty, parse } from "./quote-basket";

const empty = { lines: [], startDate: "", endDate: "" };

describe("parse", () => {
  it("returns an empty basket for missing or malformed storage", () => {
    expect(parse(null)).toEqual(empty);
    expect(parse("")).toEqual(empty);
    expect(parse("not json")).toEqual(empty);
    expect(parse("null")).toEqual(empty);
  });

  it("keeps valid lines and dates", () => {
    const json = JSON.stringify({ lines: [{ itemId: "a", qty: 2 }], startDate: "2026-12-01", endDate: "2026-12-03" });
    expect(parse(json)).toEqual({ lines: [{ itemId: "a", qty: 2 }], startDate: "2026-12-01", endDate: "2026-12-03" });
  });

  it("drops lines with a bad id or quantity", () => {
    const lines = [
      { itemId: "ok", qty: 99 },
      { itemId: "zero", qty: 0 },
      { itemId: "over", qty: 100 },
      { itemId: "fraction", qty: 1.5 },
      { itemId: "string-qty", qty: "2" },
      { itemId: 7, qty: 1 },
      { qty: 1 },
      null,
      "junk",
    ];
    expect(parse(JSON.stringify({ lines })).lines).toEqual([{ itemId: "ok", qty: 99 }]);
  });

  it("ignores non-array lines and non-string dates", () => {
    expect(parse(JSON.stringify({ lines: "x", startDate: 5, endDate: null }))).toEqual(empty);
  });
});

describe("clampQty", () => {
  it("floors fractions and enforces a minimum of 1", () => {
    expect(clampQty(2.9)).toBe(2);
    expect(clampQty(0)).toBe(1);
    expect(clampQty(-4)).toBe(1);
  });

  it("never exceeds 99 or the per-item max", () => {
    expect(clampQty(500)).toBe(99);
    expect(clampQty(500, 500)).toBe(99);
    expect(clampQty(10, 4)).toBe(4);
    expect(clampQty(3, 4)).toBe(3);
  });
});
