"use client";

import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

const STORAGE_KEY = "fiu:quote-basket";
const MAX_QTY = 99;

const lineSchema = z.object({ itemId: z.string(), qty: z.number().int().min(1).max(MAX_QTY) });

export type BasketLine = z.infer<typeof lineSchema>;
export type Basket = { lines: BasketLine[]; startDate: string; endDate: string };

const EMPTY: Basket = { lines: [], startDate: "", endDate: "" };

/** Whatever is in storage: bad lines are dropped one by one, anything else falls back to empty. */
export const basketSchema = z
  .object({
    lines: z
      .array(lineSchema.nullable().catch(null))
      .transform((lines) => lines.filter((line) => line !== null))
      .catch([]),
    startDate: z.string().catch(""),
    endDate: z.string().catch(""),
  })
  .catch(EMPTY);

export const clampQty = (qty: number, max = MAX_QTY) => Math.min(max, MAX_QTY, Math.max(1, Math.floor(qty)));

type BasketActions = {
  /** `max` is the item's per-quote cap from Sanity; quantities never go above it. */
  add: (itemId: string, qty?: number, max?: number) => void;
  setQty: (itemId: string, qty: number, max?: number) => void;
  remove: (itemId: string) => void;
  setDates: (dates: Partial<Pick<Basket, "startDate" | "endDate">>) => void;
  clear: () => void;
};

// Storage can be blocked (private mode, policies) or full; the basket then lives for the session only.
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {}
  },
};

export const useBasketStore = create<Basket & BasketActions>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      add: (itemId, qty = 1, max = MAX_QTY) => {
        const { lines } = get();
        const existing = lines.find((l) => l.itemId === itemId);
        set({
          lines: existing
            ? lines.map((l) => (l.itemId === itemId ? { ...l, qty: clampQty(l.qty + qty, max) } : l))
            : [...lines, { itemId, qty: clampQty(qty, max) }],
        });
      },
      setQty: (itemId, qty, max = MAX_QTY) => {
        if (qty < 1) return get().remove(itemId);
        set({ lines: get().lines.map((l) => (l.itemId === itemId ? { ...l, qty: clampQty(qty, max) } : l)) });
      },
      remove: (itemId) => set({ lines: get().lines.filter((l) => l.itemId !== itemId) }),
      setDates: (dates) => set(dates),
      clear: () => set(EMPTY),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ lines, startDate, endDate }) => ({ lines, startDate, endDate }),
      merge: (persisted, current) => (persisted === undefined ? current : { ...current, ...basketSchema.parse(persisted) }),
      // The server and the first client render must both be empty, so storage is read after mount.
      skipHydration: true,
    },
  ),
);

export const basketActions: BasketActions = {
  add: (...args) => useBasketStore.getState().add(...args),
  setQty: (...args) => useBasketStore.getState().setQty(...args),
  remove: (...args) => useBasketStore.getState().remove(...args),
  setDates: (...args) => useBasketStore.getState().setDates(...args),
  clear: () => useBasketStore.getState().clear(),
};

let started = false;

/** Reads the stored basket once on the client and keeps it in sync with other tabs. */
export function startBasketSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  void useBasketStore.persist.rehydrate();
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue === null) useBasketStore.setState(EMPTY);
    else void useBasketStore.persist.rehydrate();
  });
}

/**
 * The quote basket, persisted to localStorage. Empty on the server and during hydration, so
 * `ready` says whether the lines are the visitor's real ones yet.
 */
export function useQuoteBasket() {
  const basket = useBasketStore();
  const ready = useSyncExternalStore(useBasketStore.persist.onFinishHydration, useBasketStore.persist.hasHydrated, () => false);
  useEffect(startBasketSync, []);
  const count = basket.lines.reduce((sum, l) => sum + l.qty, 0);
  return { ...basket, count, ready };
}
