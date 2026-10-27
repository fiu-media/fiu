import { LOGO_PARAM_PRESETS, type LogoGlassParams, type LogoRimLook } from "./logoConfig";

/**
 * Rough relative GPU cost for playground feedback.
 * MeshTransmissionMaterial dominates via samples × resolution²; env soft lights
 * matter because Environment re-renders every frame; point lights are lighter.
 */
export function estimateLogoCost(params: LogoGlassParams) {
  const softOn = params.lights.soft.filter((l) => l.enabled).length;
  const pointsOn = params.lights.points.filter((l) => l.enabled).length;
  const backsideMul = params.backside === false ? 1 : 2;
  const transmission = params.samples * (params.resolution / 256) ** 2 * backsideMul;
  const soft = softOn * 2.2;
  const points = pointsOn * 1.1;
  return {
    transmission,
    soft,
    points,
    softOn,
    pointsOn,
    total: transmission + soft + points,
  };
}

export function costVsPreset(params: LogoGlassParams, rimLook: LogoRimLook) {
  const current = estimateLogoCost(params);
  const baseline = estimateLogoCost(LOGO_PARAM_PRESETS[rimLook]);
  const ratio = baseline.total > 0 ? current.total / baseline.total : 1;
  return { ...current, baseline: baseline.total, ratio };
}

export type LogoPerfStats = {
  fps: number;
  frameMs: number;
  triangles: number;
  calls: number;
};
