import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useCallback, useEffect, useRef } from "react";

import {
  FLOOR_SECONDS,
  higherTier,
  type LogoTier,
  lowerTier,
  medianFps,
  MIDSESSION_FLOOR_FPS,
  PROBE_WARMUP_FRAMES,
  probeComplete,
  probeVerdict,
  TIER_SETTINGS,
} from "../logoTier";

/** A gap this long between frames is the demand loop waking from idle, not a slow frame. */
const IDLE_GAP_SECONDS = 0.5;

/**
 * Picks and keeps the quality tier. First a probe: once the shaders have compiled, time
 * `PROBE_FRAMES` frames (behind the splash, which hides the canvas) and step down, or give up, by
 * `probeVerdict`. Only then is the scene reported ready. Once the intro is over, step down while
 * frames stay slow and back up (never past the starting tier) once they recover; at `low`, a
 * sustained crawl gives up too. No steps during the intro: a step recompiles the material, and a
 * hitch mid-spin is worse than a slightly slow spin (a crawl still gives up). Without `adaptive`
 * (the playground) it only waits out the warm-up.
 */
export function useLogoQuality({
  adaptive,
  startTier,
  tier,
  setTier,
  readyRef,
  introOver,
  onReady,
  onTooSlow,
}: {
  adaptive: boolean;
  introOver: boolean;
  startTier: LogoTier;
  tier: LogoTier;
  setTier: (tier: LogoTier) => void;
  readyRef: RefObject<boolean>;
  onReady: () => void;
  onTooSlow: (() => void) | undefined;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);
  const probe = useRef({
    // Without the assertion the ref would be typed `string`.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    phase: "warmup" as "warmup" | "measure" | "done",
    frames: 0,
    ms: [] as number[],
    want: startTier,
    measured: false,
  });
  const run = useRef({ slow: 0, fast: 0, crawl: 0, cooldown: 0, gaveUp: false });
  const pacing = useRef({ fences: [] as WebGLSync[], waiting: null as WebGLSync | null, timer: 0 });

  // The canvas was created at the starting tier's pixel ratio; follow later steps.
  const dprTier = useRef(startTier);
  useEffect(() => {
    if (tier === dprTier.current) return;
    dprTier.current = tier;
    setDpr(TIER_SETTINGS[tier].dpr);
  }, [tier, setDpr]);

  const releaseFences = useCallback(() => {
    const ctx = gl.getContext() as WebGL2RenderingContext;
    const q = pacing.current;
    window.clearTimeout(q.timer);
    for (const sync of q.waiting ? [q.waiting, ...q.fences] : q.fences) ctx.deleteSync(sync);
    q.fences = [];
    q.waiting = null;
  }, [gl]);
  useEffect(() => releaseFences, [releaseFences]);

  const log = (message: string) => {
    // Dev-only tier diagnostics.
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== "production") console.info(`[logo tier] ${message}`);
  };
  const step = (next: LogoTier) => {
    probe.current.want = next;
    run.current.cooldown = PROBE_WARMUP_FRAMES;
    setTier(next);
  };
  const giveUp = (why: string) => {
    probe.current.phase = "done";
    run.current.gaveUp = true;
    log(`too slow ${why}, falling back to the SVG`);
    onTooSlow?.();
  };

  /**
   * Asks for the next probe frame, holding it back while the GPU is more than a frame behind, so
   * frame times include the GPU's work. Browsers normally hold rAF back like this for a slow GPU,
   * but not all do (headless Chromium doesn't): frames then queue up faster than they're drawn, the
   * probe reads them as fast, and the stall lands later, on screen.
   */
  const nextProbeFrame = () => {
    const ctx = gl.getContext() as WebGL2RenderingContext;
    const q = pacing.current;
    // Placed before this frame renders, so it covers everything up to the previous frame.
    const sync = ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      invalidate();
      return;
    }
    ctx.flush();
    q.fences.push(sync);
    // The fence placed a frame ago: once it has signalled, only one frame is still in flight.
    const behind = q.fences.length > 1 ? (q.fences.shift() ?? null) : null;
    if (!behind) {
      invalidate();
      return;
    }
    q.waiting = behind;
    // A sync's status only updates between tasks, so a GPU that's behind is polled from timers.
    const check = () => {
      if (ctx.getSyncParameter(behind, ctx.SYNC_STATUS) !== ctx.SIGNALED) {
        q.timer = window.setTimeout(check, 1);
        return;
      }
      ctx.deleteSync(behind);
      q.waiting = null;
      invalidate();
    };
    check();
  };

  // A function so TypeScript doesn't keep its narrowing from before `probeFrame` ran.
  const stillProbing = () => probe.current.phase !== "done";
  const probeFrame = (delta: number) => {
    const p = probe.current;
    // A tier switch recompiles the material: wait for it to render, then warm it up again.
    if (tier !== p.want) return;
    if (p.phase === "warmup") {
      if (++p.frames < PROBE_WARMUP_FRAMES) return;
      if (adaptive && !p.measured) {
        p.phase = "measure";
        p.ms = [];
        return;
      }
      p.phase = "done";
      readyRef.current = true;
      onReady();
      return;
    }
    p.ms.push(delta * 1000);
    // A device far below the floor would take ages to draw every probe frame, so it can stop early.
    if (!probeComplete(p.ms)) return;
    const { next, reprobe } = probeVerdict(p.ms, tier);
    log(`probe at ${tier}: ${medianFps(p.ms).toFixed(0)} fps over ${p.ms.length} frames → ${next}`);
    if (next === "static") {
      giveUp(`at ${tier}`);
      return;
    }
    p.measured = !reprobe;
    p.phase = "warmup";
    p.frames = next === tier ? PROBE_WARMUP_FRAMES - 1 : 0;
    if (next !== tier) step(next);
  };

  useFrame((_, delta) => {
    const p = probe.current;
    if (p.phase !== "done") {
      probeFrame(delta);
      if (!stillProbing()) {
        releaseFences();
        return;
      }
      if (adaptive) nextProbeFrame();
      else invalidate();
      return;
    }

    const r = run.current;
    if (!adaptive || r.gaveUp || delta > IDLE_GAP_SECONDS) return;
    if (r.cooldown > 0) {
      r.cooldown--;
      return;
    }
    const fps = 1 / delta;
    // A crawl gives up on the glass: during the intro at any tier (its clock is frame-capped, so a
    // crawling intro also drags on), afterwards once there's no cheaper tier left to try.
    if (!introOver || tier === "low") {
      r.crawl = fps < MIDSESSION_FLOOR_FPS ? r.crawl + delta : 0;
      if (r.crawl > FLOOR_SECONDS) {
        giveUp(introOver ? "mid-session" : "during the intro");
        return;
      }
    }
    if (!introOver) return;
    if (fps < 30) {
      r.slow += delta;
      r.fast = 0;
      const lower = lowerTier(tier);
      if (r.slow > 1.2 && lower) {
        r.slow = 0;
        log(`slow, stepping down to ${lower}`);
        step(lower);
      }
    } else if (fps > 48) {
      r.fast += delta;
      r.slow = 0;
      const higher = higherTier(tier, startTier);
      if (r.fast > 2 && higher) {
        r.fast = 0;
        log(`recovered, stepping up to ${higher}`);
        step(higher);
      }
    } else {
      r.slow = 0;
      r.fast = 0;
    }
  });
}
