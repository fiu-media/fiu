import type { KeyboardEvent } from "react";

/** `index` kept inside `0..count-1`, wrapping round either end. */
export function wrapIndex(index: number, count: number) {
  return ((index % count) + count) % count;
}

/** Where a key press should go from `index`, or null if the key isn't one that steps. */
export function stepTarget(key: string, index: number, count: number) {
  if (key === "ArrowRight") return index + 1;
  if (key === "ArrowLeft") return index - 1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

/** Stepping through `count` items with wrap-around, and the arrow/Home/End keys that do it. With one item there is nothing to step. */
export function useStepper(count: number, index: number, setIndex: (index: number) => void) {
  const select = (next: number) => setIndex(wrapIndex(next, count));

  function onKeyDown(event: KeyboardEvent) {
    if (count < 2) return;
    const target = stepTarget(event.key, index, count);
    if (target === null) return;
    event.preventDefault();
    select(target);
  }

  return { select, onKeyDown };
}
