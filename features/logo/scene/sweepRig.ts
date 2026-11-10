import { type RefObject, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * What the studio light shares with whatever moves it. `Studio` reads it; the playground's
 * `SweepDriver` writes it. The live hero never sweeps, so it runs on an inert rig.
 */
export type SweepRig = {
  /** The group the soft lights sit in; the driver moves it for the "move" technique. */
  groupRef: RefObject<THREE.Group | null>;
  /** True while the light is visibly moving, which keeps the env cubemap re-baking. */
  liveRef: RefObject<boolean>;
  /** Handed to <Environment> so its own effect re-applies the current rotation instead of resetting it. */
  envRotation: THREE.Euler;
};

export function useSweepRig(): SweepRig {
  const groupRef = useRef<THREE.Group>(null);
  const liveRef = useRef(false);
  const [envRotation] = useState(() => new THREE.Euler());
  return useMemo(() => ({ groupRef, liveRef, envRotation }), [envRotation]);
}
