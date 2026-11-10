import { useSyncExternalStore } from "react";

/** Whether `query` matches right now. For effects and handlers; components should use `useMediaQuery`. Client only. */
export const matches = (query: string) => window.matchMedia(query).matches;

/** A `subscribe` for `useSyncExternalStore` that fires when `query` starts or stops matching. */
export function subscribeToMedia(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
}

// One subscribe function per query, so React doesn't resubscribe on every render.
const subscribers = new Map<string, ReturnType<typeof subscribeToMedia>>();
function subscriberFor(query: string) {
  let subscribe = subscribers.get(query);
  if (!subscribe) subscribers.set(query, (subscribe = subscribeToMedia(query)));
  return subscribe;
}

/**
 * Live result of a media query. `serverValue` is what the server and the hydration render see, so the first client
 * render agrees with the HTML; the real answer follows straight after.
 */
export function useMediaQuery(query: string, serverValue: boolean) {
  return useSyncExternalStore(
    subscriberFor(query),
    () => matches(query),
    () => serverValue,
  );
}
