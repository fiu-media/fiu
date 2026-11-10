"use client";

import type { LogoGlassParams, LogoMeshMode, LogoPerfStats } from "@/features/logo";
import { CanvasRoot } from "@/features/logo/CanvasRoot";
import type { LightSweep } from "@/features/logo/lightSweep";
import { preloadStill, type SceneStill } from "@/features/logo/scene/stills";
import { useSweepRig } from "@/features/logo/scene/sweepRig";

import { PerfSampler } from "./PerfSampler";
import { SweepDriver } from "./SweepDriver";

/**
 * The live logo with the playground's extras on top of the hero's: the params being edited, a
 * continuous full-quality frame loop with a FPS readout, and the moving studio light.
 */
export default function PlaygroundScene({
  stills,
  index,
  onReady,
  meshMode,
  params,
  sweep,
  onPerf,
}: {
  stills: SceneStill[];
  index: number;
  onReady: () => void;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
  /** Slowly sweeps the studio light (the /dev/moving-light experiment). Off when undefined. */
  sweep?: LightSweep;
  onPerf: (stats: LogoPerfStats) => void;
}) {
  const rig = useSweepRig();
  // Same early start as the hero: see LogoScene.
  preloadStill(stills[index]!.src);
  return (
    <CanvasRoot
      stills={stills}
      index={index}
      onReady={onReady}
      meshMode={meshMode}
      params={params}
      measurePerf
      rig={rig}
      sweepDriver={<SweepDriver sweep={sweep} rig={rig} />}
    >
      <PerfSampler onPerf={onPerf} />
    </CanvasRoot>
  );
}
