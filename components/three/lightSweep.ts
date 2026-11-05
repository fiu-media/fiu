/**
 * A slow light sweep (the #51 experiment). One sine clock drives the WebGL scene, and the same
 * phase seeds the CSS highlight, so the two can be compared or run together in step.
 */

export type SweepAxis = "x" | "y" | "orbit";

/** `move` shifts the env lights and re-bakes the cubemap; `rotate` turns the frozen cubemap. */
export type SweepTechnique = "move" | "rotate";

export type LightSweep = {
  axis: SweepAxis;
  technique: SweepTechnique;
  periodSeconds: number;
  /** 0..1 share of the full travel. */
  amplitude: number;
  /** `performance.now()` at which the sweep sat at its centre, heading right/up. */
  origin: number;
  /** `performance.now()` when paused, null while running. */
  pausedAt: number | null;
};

/** Env-light travel in world units at amplitude 1. */
export const MOVE_RANGE = 8;
/** Env rotation in radians at amplitude 1. */
export const ROTATE_RANGE = 0.7;
/** Orbit squashes Y so the path is a slow ellipse rather than a circle. */
const ORBIT_Y = 0.5;

/** Normalised offset (each -amplitude..amplitude) of the light at time `now` (ms). */
export function sweepAt(sweep: LightSweep, now: number) {
  const t = ((sweep.pausedAt ?? now) - sweep.origin) / 1000;
  const theta = (2 * Math.PI * t) / sweep.periodSeconds;
  const a = sweep.amplitude;
  if (sweep.axis === "x") return { x: Math.sin(theta) * a, y: 0 };
  if (sweep.axis === "y") return { x: 0, y: Math.sin(theta) * a };
  return { x: Math.sin(theta) * a, y: Math.cos(theta) * a * ORBIT_Y };
}

/**
 * Where the stylesheet's alternating 0→1 animation should be, in seconds into its run, to match
 * `sweepAt`. The CSS value reads 0.5 at the centre, so it runs a quarter period ahead of the sine;
 * orbit's Y is a cosine, a further quarter ahead. The caller sets each animation's `currentTime`
 * to this, so the CSS and WebGL lights share one phase without restarting anything.
 */
export function sweepCssTime(sweep: LightSweep, now: number, channel: "x" | "y") {
  const t = ((sweep.pausedAt ?? now) - sweep.origin) / 1000;
  const quarter = sweep.periodSeconds / 4;
  return t + quarter + (channel === "y" && sweep.axis === "orbit" ? quarter : 0);
}
