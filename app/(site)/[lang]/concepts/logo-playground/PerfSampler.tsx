import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import type { LogoPerfStats } from "@/features/logo";

/** Samples FPS / frame time and renderer info ~2×/sec for the playground HUD. */
export function PerfSampler({ onPerf }: { onPerf: (stats: LogoPerfStats) => void }) {
  const gl = useThree((s) => s.gl);
  const onPerfRef = useRef(onPerf);
  useEffect(() => {
    onPerfRef.current = onPerf;
  }, [onPerf]);
  const bucket = useRef({ started: 0, frames: 0, frameMs: 0 });

  useFrame((_, delta) => {
    const b = bucket.current;
    b.frames += 1;
    b.frameMs = delta * 1000;
    const now = performance.now();
    if (!b.started) b.started = now;
    if (now - b.started < 500) return;
    const fps = (b.frames * 1000) / (now - b.started);
    b.frames = 0;
    b.started = now;
    onPerfRef.current({
      fps,
      frameMs: b.frameMs,
      triangles: gl.info.render.triangles,
      calls: gl.info.render.calls,
    });
  });

  return null;
}
