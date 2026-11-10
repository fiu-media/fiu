import * as THREE from "three";

import type { LogoGlassParams } from "../config/schemas";

/** Floor for the interaction `weight` so a stray 0 can't divide by zero. */
export const MIN_WEIGHT = 0.05;
/** Start the return spring once coasting has nearly stopped (not exactly 0). */
const DRAG_VELOCITY_EPS = 0.08;
const DRAG_ANGLE_EPS = 0.0015;

/** The pointer-drag spin: where the logo is turned to, how fast it is still turning, and whether it is springing home. */
export type DragState = {
  active: boolean;
  returning: boolean;
  lastX: number;
  lastY: number;
  lastT: number;
  rotX: number;
  rotY: number;
  velX: number;
  velY: number;
};

export const newDragState = (): DragState => ({
  active: false,
  returning: false,
  lastX: 0,
  lastY: 0,
  lastT: 0,
  rotX: 0,
  rotY: 0,
  velX: 0,
  velY: 0,
});

/** Where the pointer is over the logo, from -1 to 1 on each axis, while it hovers. */
export type HoverState = { active: boolean; x: number; y: number };

/** Wrap to (-π, π] so return takes the shortest way home. */
function shortestAngle(radians: number) {
  const wrapped = ((((radians + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return wrapped === -Math.PI ? Math.PI : wrapped;
}

/** Eases the hover wobble towards the pointer while hovering (and not dragging), and back to rest on leave. */
export function followHover(
  tilt: { x: number; y: number },
  hover: HoverState,
  dragging: boolean,
  look: LogoGlassParams,
  weight: number,
  delta: number,
) {
  const k = 1 - Math.exp((-delta * look.hoverLerp) / weight);
  const following = hover.active && !dragging;
  tilt.x = THREE.MathUtils.lerp(tilt.x, following ? hover.y * look.hoverTiltX : 0, k);
  tilt.y = THREE.MathUtils.lerp(tilt.y, following ? hover.x * look.hoverTiltY : 0, k);
}

/** Lets the spin coast after a release, then springs it home. Returns whether it is still moving (so a frame is due). */
export function stepDrag(d: DragState, look: LogoGlassParams, weight: number, delta: number): boolean {
  if (d.active) return false;
  // Latch return once coasting is nearly done — don't flip back when the bounce speeds up.
  if (!d.returning && Math.abs(d.velX) < DRAG_VELOCITY_EPS && Math.abs(d.velY) < DRAG_VELOCITY_EPS) {
    d.returning = true;
    d.velX = 0;
    d.velY = 0;
    // Don't unwind full turns — spring along the nearest angle to rest.
    d.rotX = shortestAngle(d.rotX);
    d.rotY = shortestAngle(d.rotY);
  }

  if (!d.returning) {
    d.rotX += d.velX * delta;
    d.rotY += d.velY * delta;
    const friction = Math.exp((-look.dragFriction / weight) * delta);
    d.velX *= friction;
    d.velY *= friction;
  } else {
    // Stiffness / mass and damping / sqrt(mass): the return slows as 1/sqrt(weight) but the
    // damping ratio (how much it overshoots) stays the same.
    const dampScale = 1 / Math.sqrt(weight);
    d.velX += ((-look.dragSpringPitch * d.rotX) / weight - look.dragSpringPitchDamp * dampScale * d.velX) * delta;
    d.velY += ((-look.dragSpring * d.rotY) / weight - look.dragSpringDamp * dampScale * d.velY) * delta;
    d.rotX += d.velX * delta;
    d.rotY += d.velY * delta;
    if (
      Math.abs(d.rotX) < DRAG_ANGLE_EPS
      && Math.abs(d.rotY) < DRAG_ANGLE_EPS
      && Math.abs(d.velX) < DRAG_VELOCITY_EPS
      && Math.abs(d.velY) < DRAG_VELOCITY_EPS
    ) {
      d.rotX = 0;
      d.rotY = 0;
      d.velX = 0;
      d.velY = 0;
      d.returning = false;
    }
  }
  const pitchMax = look.dragPitchMax;
  if (Math.abs(d.rotX) > pitchMax) {
    d.rotX = THREE.MathUtils.clamp(d.rotX, -pitchMax, pitchMax);
    d.velX = 0;
  }
  return Boolean(d.velX || d.velY || d.rotX || d.rotY || d.returning);
}

/** Internal glow picks up the still temperature (like liquid-glass.jpg's warm core). */
export function tintGlow(
  mat: (THREE.MeshPhysicalMaterial & { attenuationColor?: THREE.Color }) | null,
  glow: THREE.Color,
  tint: THREE.Color,
  look: LogoGlassParams,
) {
  if (!mat?.attenuationColor) return;
  glow.copy(tint);
  const hsl = { h: 0, s: 0, l: 0 };
  glow.getHSL(hsl);
  glow.setHSL(
    hsl.h,
    Math.min(0.85, hsl.s * look.glowSat),
    THREE.MathUtils.clamp(hsl.l + look.glowLift, look.glowLMin, look.glowLMax),
  );
  mat.attenuationColor.copy(glow);
}

export type IntroStats = { frames: number; ms: number; worst: number; logged: boolean };

/**
 * Dev only: how smooth the hero intro really is on this machine (GPU cost can't be seen in a
 * CPU profile). Counts each intro frame and logs once, when the intro ends.
 */
export function logIntroFrame(st: IntroStats, rawDelta: number, t: number, introEnd: number) {
  if (process.env.NODE_ENV === "production") return;
  if (t < introEnd) {
    st.frames++;
    st.ms += rawDelta * 1000;
    st.worst = Math.max(st.worst, rawDelta * 1000);
  } else if (!st.logged && st.frames > 0) {
    st.logged = true;
    // One-off intro frame-rate readout.
    // eslint-disable-next-line no-console
    console.info(
      `[logo intro] ${st.frames} frames over ${(st.ms / 1000).toFixed(2)}s: `
        + `${((st.frames * 1000) / st.ms).toFixed(0)} fps avg, worst frame ${st.worst.toFixed(0)} ms`,
    );
  }
}
