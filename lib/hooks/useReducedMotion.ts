import { REDUCED_MOTION } from "../media";
import { matches, subscribeToMedia, useMediaQuery } from "./useMediaQuery";

export const subscribeToReducedMotion = subscribeToMedia(REDUCED_MOTION);

export const prefersReducedMotion = () => matches(REDUCED_MOTION);

/**
 * Live `prefers-reduced-motion` preference. The server snapshot (and the hydration render) assume reduced,
 * so nothing animates until the client has read the real setting.
 *
 * Not `useReducedMotion` from `motion/react`: that one reads the setting once and never re-renders on a
 * change, and it returns a different value on the first client render than on the server.
 */
export function useReducedMotion() {
  return useMediaQuery(REDUCED_MOTION, true);
}
