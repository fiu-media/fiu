"use client";

import { useSyncExternalStore } from "react";

export type BasketLine = { itemId: string; qty: number };
export type Basket = { lines: BasketLine[]; startDate: string; endDate: string };

const STORAGE_KEY = "fiu:quote-basket";
const MAX_QTY = 99;

const EMPTY: Basket = { lines: [], startDate: "", endDate: "" };

let snapshot: Basket = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function parse(json: string | null): Basket {
  if (!json) return EMPTY;
  try {
    const value = JSON.parse(json) as Partial<Basket>;
    const lines = Array.isArray(value.lines)
      ? value.lines.filter(
          (l): l is BasketLine =>
            typeof l?.itemId === "string" && Number.isInteger(l.qty) && l.qty >= 1 && l.qty <= MAX_QTY,
        )
      : [];
    return {
      lines,
      startDate: typeof value.startDate === "string" ? value.startDate : "",
      endDate: typeof value.endDate === "string" ? value.endDate : "",
    };
  } catch {
    return EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    snapshot = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be blocked (private mode, policies); the basket then lives for the session only.
  }
  // Other tabs: keep the basket in sync.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = parse(event.newValue);
    emit();
  });
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: Basket) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // See load(): persistence is best effort.
  }
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => {
  load();
  return snapshot;
};
const getServerSnapshot = () => EMPTY;

const clampQty = (qty: number, max = MAX_QTY) => Math.min(max, MAX_QTY, Math.max(1, Math.floor(qty)));

export const basketActions = {
  /** `max` is the item's per-quote cap from Sanity; quantities never go above it. */
  add(itemId: string, qty = 1, max = MAX_QTY) {
    const { lines } = snapshot;
    const existing = lines.find((l) => l.itemId === itemId);
    commit({
      ...snapshot,
      lines: existing
        ? lines.map((l) => (l.itemId === itemId ? { ...l, qty: clampQty(l.qty + qty, max) } : l))
        : [...lines, { itemId, qty: clampQty(qty, max) }],
    });
  },
  setQty(itemId: string, qty: number, max = MAX_QTY) {
    if (qty < 1) return basketActions.remove(itemId);
    commit({ ...snapshot, lines: snapshot.lines.map((l) => (l.itemId === itemId ? { ...l, qty: clampQty(qty, max) } : l)) });
  },
  remove(itemId: string) {
    commit({ ...snapshot, lines: snapshot.lines.filter((l) => l.itemId !== itemId) });
  },
  setDates(dates: Partial<Pick<Basket, "startDate" | "endDate">>) {
    commit({ ...snapshot, ...dates });
  },
  clear() {
    commit(EMPTY);
  },
};

const subscribeNever = () => () => {};

/**
 * The quote basket, persisted to localStorage. Empty on the server and during hydration, so
 * `ready` says whether the lines are the visitor's real ones yet.
 */
export function useQuoteBasket() {
  const basket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const count = basket.lines.reduce((sum, l) => sum + l.qty, 0);
  return { ...basket, count, ready, ...basketActions };
}
