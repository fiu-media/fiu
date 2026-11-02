import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { basketSchema, clampQty } from "./quote-basket";

const empty = { lines: [], startDate: "", endDate: "" };

describe("basketSchema", () => {
  it("returns an empty basket for missing or malformed storage", () => {
    expect(basketSchema.parse(undefined)).toEqual(empty);
    expect(basketSchema.parse(null)).toEqual(empty);
    expect(basketSchema.parse("junk")).toEqual(empty);
    expect(basketSchema.parse({})).toEqual(empty);
  });

  it("keeps valid lines and dates", () => {
    const value = { lines: [{ itemId: "a", qty: 2 }], startDate: "2026-12-01", endDate: "2026-12-03" };
    expect(basketSchema.parse(value)).toEqual(value);
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
    expect(basketSchema.parse({ lines }).lines).toEqual([{ itemId: "ok", qty: 99 }]);
  });

  it("ignores non-array lines and non-string dates", () => {
    expect(basketSchema.parse({ lines: "x", startDate: 5, endDate: null })).toEqual(empty);
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

describe("basket store", () => {
  const KEY = "fiu:quote-basket";
  let data: Map<string, string>;
  let listeners: ((event: { key: string | null; newValue: string | null }) => void)[];

  const stored = (state: unknown) => JSON.stringify({ state, version: 1 });

  /** A fresh copy of the module, so each test starts un-hydrated. */
  async function load() {
    vi.resetModules();
    return import("./quote-basket");
  }

  beforeEach(() => {
    data = new Map();
    listeners = [];
    const localStorage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    };
    vi.stubGlobal("window", {
      localStorage,
      addEventListener: (_: string, listener: (typeof listeners)[number]) => listeners.push(listener),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("adds lines, merges repeats and caps at the item max and 99", async () => {
    const { basketActions, useBasketStore } = await load();
    basketActions.add("a", 2, 5);
    basketActions.add("a", 10, 5);
    basketActions.add("b", 500);
    expect(useBasketStore.getState().lines).toEqual([
      { itemId: "a", qty: 5 },
      { itemId: "b", qty: 99 },
    ]);
  });

  it("clamps setQty, removes below 1, and sets dates", async () => {
    const { basketActions, useBasketStore } = await load();
    basketActions.add("a");
    basketActions.setQty("a", 7, 3);
    expect(useBasketStore.getState().lines).toEqual([{ itemId: "a", qty: 3 }]);
    basketActions.setQty("a", 0);
    expect(useBasketStore.getState().lines).toEqual([]);
    basketActions.setDates({ startDate: "2026-12-01" });
    basketActions.setDates({ endDate: "2026-12-03" });
    expect(useBasketStore.getState()).toMatchObject({ startDate: "2026-12-01", endDate: "2026-12-03" });
  });

  it("persists changes and clears", async () => {
    const { basketActions, useBasketStore } = await load();
    basketActions.add("a");
    expect(JSON.parse(data.get(KEY)!).state.lines).toEqual([{ itemId: "a", qty: 1 }]);
    basketActions.clear();
    expect(useBasketStore.getState()).toMatchObject(empty);
    expect(JSON.parse(data.get(KEY)!).state).toEqual(empty);
  });

  it("stays empty until sync starts, then loads the stored basket", async () => {
    data.set(
      KEY,
      stored({
        lines: [
          { itemId: "a", qty: 2 },
          { itemId: "bad", qty: 0 },
        ],
        startDate: "2026-12-01",
      }),
    );
    const { startBasketSync, useBasketStore } = await load();
    expect(useBasketStore.persist.hasHydrated()).toBe(false);
    expect(useBasketStore.getState().lines).toEqual([]);
    startBasketSync();
    expect(useBasketStore.persist.hasHydrated()).toBe(true);
    expect(useBasketStore.getState()).toMatchObject({
      lines: [{ itemId: "a", qty: 2 }],
      startDate: "2026-12-01",
      endDate: "",
    });
  });

  it("falls back to an empty basket for stored garbage", async () => {
    data.set(KEY, stored("junk"));
    const { startBasketSync, useBasketStore } = await load();
    startBasketSync();
    expect(useBasketStore.persist.hasHydrated()).toBe(true);
    expect(useBasketStore.getState()).toMatchObject(empty);
  });

  it("keeps working in memory when storage is blocked", async () => {
    vi.stubGlobal("window", {
      get localStorage(): never {
        throw new Error("blocked");
      },
      addEventListener: () => {},
    });
    const { basketActions, startBasketSync, useBasketStore } = await load();
    startBasketSync();
    basketActions.add("a", 2);
    expect(useBasketStore.persist.hasHydrated()).toBe(true);
    expect(useBasketStore.getState().lines).toEqual([{ itemId: "a", qty: 2 }]);
  });

  it("follows other tabs through storage events", async () => {
    const { startBasketSync, useBasketStore } = await load();
    startBasketSync();
    const value = stored({ lines: [{ itemId: "a", qty: 3 }], startDate: "", endDate: "" });
    data.set(KEY, value);
    listeners.forEach((l) => l({ key: "other", newValue: value }));
    expect(useBasketStore.getState().lines).toEqual([]);
    listeners.forEach((l) => l({ key: KEY, newValue: value }));
    expect(useBasketStore.getState().lines).toEqual([{ itemId: "a", qty: 3 }]);
    listeners.forEach((l) => l({ key: KEY, newValue: null }));
    expect(useBasketStore.getState()).toMatchObject(empty);
  });
});
