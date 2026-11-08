import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export const prefersReducedMotion = () => window.matchMedia(QUERY).matches;

/**
 * Live `prefers-reduced-motion` preference. The server snapshot (and the hydration render) assume reduced,
 * so nothing animates until the client has read the real setting.
 *
 * Not `useReducedMotion` from `motion/react`: that one reads the setting once and never re-renders on a
 * change, and it returns a different value on the first client render than on the server.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => true);
}
