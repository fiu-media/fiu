import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";

import { configureStill } from "./stills";

/**
 * The stills after the first, loaded one at a time in the background once `enabled` (`srcs` is their sources joined by
 * "|"; the first is skipped). Keyed by source; one that fails to load is left out.
 */
export function useRestStills(srcs: string, firstSrc: string, enabled: boolean) {
  const gl = useThree((s) => s.gl);
  const [rest, setRest] = useState<Record<string, THREE.Texture>>({});
  useEffect(() => {
    if (!enabled) return;
    // Aborted by the cleanup below, which can happen while the loop awaits.
    const controller = new AbortController();
    const { signal } = controller;
    const loader = new THREE.TextureLoader();
    // Fire and forget: the stills past the first load in the background, and a failed one is skipped below.
    void (async () => {
      for (const src of srcs.split("|")) {
        if (src === firstSrc) continue;
        try {
          const t = configureStill(await loader.loadAsync(src));
          if (signal.aborted) {
            t.dispose();
            return;
          }
          // Upload now, at idle, rather than inside the first crossfade that samples it.
          gl.initTexture(t);
          setRest((prev) => ({ ...prev, [src]: t }));
        } catch (error) {
          // A still that fails to load just keeps the previous one behind the glass.
          console.warn("[LogoScene] still failed to load:", src, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 60));
        if (signal.aborted) return;
      }
    })();
    return () => controller.abort();
  }, [enabled, srcs, firstSrc, gl]);
  return rest;
}
