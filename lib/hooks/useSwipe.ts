import { type PointerEvent, useRef } from "react";

/** Which way a sideways drag of `distance` px steps (a swipe left goes forward), or 0 if it was too short. */
export function swipeStep(distance: number, threshold: number) {
  if (Math.abs(distance) < threshold) return 0;
  return distance < 0 ? 1 : -1;
}

/** Pointer handlers that turn a sideways swipe of at least `threshold` px into `onStep(1 | -1)`. */
export function useSwipe(onStep: (direction: 1 | -1) => void, threshold: number) {
  const from = useRef<number | null>(null);
  const down = useRef(new Set<number>());

  return {
    onPointerDown: (event: PointerEvent) => {
      down.current.add(event.pointerId);
      // A second finger is a pinch, not a swipe.
      from.current = down.current.size > 1 ? null : event.clientX;
    },
    onPointerUp: (event: PointerEvent) => {
      down.current.delete(event.pointerId);
      if (from.current === null) return;
      const step = swipeStep(event.clientX - from.current, threshold);
      from.current = null;
      // Once the page is pinch-zoomed a sideways drag pans it instead.
      if (step !== 0 && (window.visualViewport?.scale ?? 1) <= 1) onStep(step);
    },
    onPointerCancel: (event: PointerEvent) => {
      down.current.delete(event.pointerId);
      from.current = null;
    },
    // Without this the browser starts dragging the image instead of reporting the swipe.
    onDragStart: (event: { preventDefault: () => void }) => event.preventDefault(),
  };
}
