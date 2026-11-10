import { type PointerEvent, useRef } from "react";

/** Which way a sideways drag of `distance` px steps (a swipe left goes forward), or 0 if it was too short. */
export function swipeStep(distance: number, threshold: number) {
  if (Math.abs(distance) < threshold) return 0;
  return distance < 0 ? 1 : -1;
}

/** Pointer handlers that turn a sideways swipe of at least `threshold` px into `onStep(1 | -1)`. */
export function useSwipe(onStep: (direction: 1 | -1) => void, threshold: number) {
  const from = useRef<number | null>(null);

  return {
    onPointerDown: (event: PointerEvent) => {
      from.current = event.clientX;
    },
    onPointerUp: (event: PointerEvent) => {
      if (from.current === null) return;
      const step = swipeStep(event.clientX - from.current, threshold);
      from.current = null;
      if (step !== 0) onStep(step);
    },
    onPointerCancel: () => {
      from.current = null;
    },
    // Without this the browser starts dragging the image instead of reporting the swipe.
    onDragStart: (event: { preventDefault: () => void }) => event.preventDefault(),
  };
}
