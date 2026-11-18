import { useCallback, useEffect, useRef, useState } from "react";

/** How long the player gets to report its film loaded before we conclude it won't (Vimeo blocked or down). */
const LOAD_TIMEOUT_MS = 10_000;

/**
 * Whether the player has failed to load its film: it reported an error, or said nothing for `LOAD_TIMEOUT_MS`
 * after `playing` began. Not final: if the film loads after all, `failed` clears.
 */
export function useLoadFailure(playing: boolean) {
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  const reset = useCallback(() => {
    loaded.current = false;
    setFailed(false);
  }, []);
  const markLoaded = useCallback(() => {
    loaded.current = true;
    setFailed(false);
  }, []);
  // After the film has loaded, a later error is the player's own to show.
  const markError = useCallback(() => {
    if (!loaded.current) setFailed(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(markError, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [playing, markError]);

  return { failed, reset, markLoaded, markError };
}
