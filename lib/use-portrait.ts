import { useSyncExternalStore } from "react";
import { PORTRAIT } from "./orientation";

function subscribeToPortrait(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the screen is portrait. The server and the hydration render assume landscape. */
export function usePortrait() {
  return useSyncExternalStore(
    subscribeToPortrait,
    () => window.matchMedia(PORTRAIT).matches,
    () => false,
  );
}
