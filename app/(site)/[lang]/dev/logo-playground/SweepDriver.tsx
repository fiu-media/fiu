import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { type LightSweep, MOVE_RANGE, ROTATE_RANGE, sweepAt } from "@/features/logo/lightSweep";
import type { SweepRig } from "@/features/logo/scene/sweepRig";
import { REDUCED_MOTION } from "@/lib/media";

/** The sweep redraws at this rate, not every display frame: the glare is slow, and each frame costs a cubemap bake. */
const SWEEP_FRAME_MS = 1000 / 30;

/**
 * Moves the studio light along the sweep and keeps the demand loop alive only while it is visibly
 * moving. It stands down (no frames at all) when the sweep is paused or off, the tab is hidden, the
 * canvas is scrolled out of view, or the user prefers reduced motion; in the last case the light
 * rests at its centre. Without a sweep it does nothing, so the live hero is unaffected.
 */
export function SweepDriver({ sweep, rig }: { sweep: LightSweep | undefined; rig: SweepRig }) {
  const { groupRef, liveRef, envRotation } = rig;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const sweepRef = useRef(sweep);
  const inView = useRef(true);
  const reduced = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    sweepRef.current = sweep;
    invalidate();
  }, [sweep, invalidate]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      inView.current = entry.isIntersecting;
      invalidate();
    });
    observer.observe(gl.domElement);
    const motion = window.matchMedia(REDUCED_MOTION);
    const onMotion = () => {
      reduced.current = motion.matches;
      invalidate();
    };
    onMotion();
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onMotion);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onMotion);
      window.clearTimeout(timer.current);
    };
  }, [gl, invalidate]);

  useFrame(() => {
    const s = sweepRef.current;
    const running = s?.pausedAt === null && !reduced.current && inView.current && !document.hidden;
    const o = s && !reduced.current ? sweepAt(s, performance.now()) : { x: 0, y: 0 };
    liveRef.current = running && s.technique === "move";

    const g = groupRef.current;
    if (g) g.position.set(s?.technique === "move" ? o.x * MOVE_RANGE : 0, s?.technique === "move" ? o.y * MOVE_RANGE : 0, 0);
    // Turning the frozen cubemap about Y slides the glare along X, about X along Y.
    if (s?.technique === "rotate") envRotation.set(-o.y * ROTATE_RANGE, o.x * ROTATE_RANGE, 0);
    else envRotation.set(0, 0, 0);
    // <Environment> copies its `environmentRotation` into the scene only when it re-renders, so the
    // scene gets the live value directly (envRotation is what it re-applies, so they never disagree).
    scene.environmentRotation.copy(envRotation);

    if (running && timer.current === undefined) {
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        invalidate();
      }, SWEEP_FRAME_MS);
    }
  });

  return null;
}
