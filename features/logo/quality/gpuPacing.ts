import type { WebGLRenderer } from "three";

/** The GPU fences the probe is waiting on, and the timer polling them. */
export type Pacing = { fences: WebGLSync[]; waiting: WebGLSync | null; timer: number };

/** The renderer's context, if it is WebGL 2 (three's renderer is WebGL 2 only, but its types allow WebGL 1). */
const webgl2 = (gl: WebGLRenderer) => {
  const ctx = gl.getContext();
  return ctx instanceof WebGL2RenderingContext ? ctx : null;
};

/** Drops every fence still held, and stops polling. */
export function releasePacing(gl: WebGLRenderer, q: Pacing) {
  const ctx = webgl2(gl);
  window.clearTimeout(q.timer);
  if (ctx) for (const sync of q.waiting ? [q.waiting, ...q.fences] : q.fences) ctx.deleteSync(sync);
  q.fences = [];
  q.waiting = null;
}

/**
 * Asks for the next probe frame (`invalidate`), holding it back while the GPU is more than a frame behind, so
 * frame times include the GPU's work. Browsers normally hold rAF back like this for a slow GPU,
 * but not all do (headless Chromium doesn't): frames then queue up faster than they're drawn, the
 * probe reads them as fast, and the stall lands later, on screen.
 */
export function holdForGpu(gl: WebGLRenderer, q: Pacing, invalidate: () => void) {
  const ctx = webgl2(gl);
  // Placed before this frame renders, so it covers everything up to the previous frame. Fences need WebGL 2; without
  // it there is nothing to wait on.
  const sync = ctx ? ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
  if (!ctx || !sync) {
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
}
