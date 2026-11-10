import type { RefObject } from "react";
import { useEffect } from "react";
import * as THREE from "three";

import type { LogoGlassParams } from "../config/schemas";
import { type DragState, MIN_WEIGHT } from "./logoMotion";

/**
 * Keeps a drag going on the window, so the rotation doesn't stop when the pointer leaves the mesh, and ends it on
 * release, cancel, blur or hiding the tab. The spin itself is read from `drag`; `setDragging` is for the cursor.
 */
export function useWindowDrag(
  drag: RefObject<DragState>,
  params: RefObject<LogoGlassParams>,
  keepAwake: (seconds: number) => void,
  setDragging: (dragging: boolean) => void,
) {
  useEffect(() => {
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
      // Keep the demand loop alive through coast + bounce settle.
      keepAwake(8);
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      // The release was missed (e.g. the window lost focus mid-drag): end the drag instead of
      // letting the stale last position turn into one huge jump.
      if (e.buttons === 0 && e.pointerType === "mouse") {
        onUp();
        return;
      }
      const look = params.current;
      const pitchMax = look.dragPitchMax;
      // Heavier = less turn per pixel (the release velocity derives from the same deltas).
      const sens = look.dragSensitivity / Math.max(look.weight, MIN_WEIGHT);
      const now = performance.now();
      const dt = Math.max((now - d.lastT) / 1000, 1 / 120);
      const dX = (e.clientY - d.lastY) * sens;
      const dY = (e.clientX - d.lastX) * sens;
      d.rotX = THREE.MathUtils.clamp(d.rotX + dX, -pitchMax, pitchMax);
      d.rotY += dY;
      // Kill pitch momentum at the soft stop so coasting can't flip it vertical.
      if (Math.abs(d.rotX) >= pitchMax - 1e-4) d.velX = 0;
      // Exponential moving average of angular velocity (rad/s).
      const vx = dX / dt;
      const vy = dY / dt;
      d.velX = THREE.MathUtils.lerp(d.velX, vx, 0.45);
      d.velY = THREE.MathUtils.lerp(d.velY, vy, 0.45);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      keepAwake(1.2);
    };
    const onHidden = () => {
      if (document.hidden) onUp();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [drag, params, keepAwake, setDragging]);
}
