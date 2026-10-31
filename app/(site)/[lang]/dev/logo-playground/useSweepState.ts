import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sweepCssTime, type LightSweep, type SweepAxis, type SweepTechnique } from "@/components/three/lightSweep";

export type SweepMode = "off" | "webgl" | "css" | "both";

type SweepState = {
  mode: SweepMode;
  technique: SweepTechnique;
  axis: SweepAxis;
  periodSeconds: number;
  amplitude: number;
  /** `performance.now()` at the sweep's centre crossing; shifted on pause and period changes. */
  origin: number;
  pausedAt: number | null;
};

const INITIAL: SweepState = {
  mode: "off",
  technique: "rotate",
  axis: "x",
  periodSeconds: 40,
  amplitude: 0.8,
  origin: 0,
  pausedAt: null,
};

/**
 * The moving-light experiment's controls and clock (issue #51). One clock feeds both the WebGL light
 * (`sweep`, passed to LogoScene) and the CSS highlight (`stageRef`, the element carrying the
 * `.sweep-stage` animation), so Both stays in step. Off by default so the playground opens as before.
 */
export function useSweepState() {
  const [state, setState] = useState<SweepState>(INITIAL);
  const stageRef = useRef<HTMLDivElement>(null);
  const { mode, technique, axis, periodSeconds, amplitude, origin, pausedAt } = state;

  const webgl = mode === "webgl" || mode === "both";
  const css = mode === "css" || mode === "both";

  // Stable between renders, so an unrelated re-render doesn't wake an idle scene.
  const sweep = useMemo<LightSweep | undefined>(
    () => (webgl ? { axis, technique, periodSeconds, amplitude, origin, pausedAt } : undefined),
    [webgl, axis, technique, periodSeconds, amplitude, origin, pausedAt],
  );

  // Put the CSS animations at the clock's phase whenever it changes. Setting currentTime keeps the
  // stage mounted, unlike restarting the animation by remounting it.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !css) return;
    const clock: LightSweep = { axis, technique, periodSeconds, amplitude, origin, pausedAt };
    const now = performance.now();
    for (const animation of stage.getAnimations()) {
      if (!(animation instanceof CSSAnimation)) continue;
      const channel = animation.animationName === "sweep-y" ? "y" : "x";
      animation.currentTime = sweepCssTime(clock, now, channel) * 1000;
    }
  }, [css, axis, technique, periodSeconds, amplitude, origin, pausedAt]);

  const patch = useCallback((next: Partial<SweepState>) => setState((s) => ({ ...s, ...next })), []);

  // Keep the same phase when the period changes, rather than jumping.
  const setPeriod = useCallback(
    (next: number) =>
      setState((s) => {
        const at = s.pausedAt ?? performance.now();
        return { ...s, periodSeconds: next, origin: at - ((at - s.origin) * next) / s.periodSeconds };
      }),
    [],
  );

  const togglePause = useCallback(
    () =>
      setState((s) => {
        const now = performance.now();
        return s.pausedAt === null
          ? { ...s, pausedAt: now }
          : { ...s, origin: s.origin + (now - s.pausedAt), pausedAt: null };
      }),
    [],
  );

  return { state, sweep, css, paused: pausedAt !== null, stageRef, patch, setPeriod, togglePause };
}
