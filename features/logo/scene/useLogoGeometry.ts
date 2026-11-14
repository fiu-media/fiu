import { useEffect, useMemo } from "react";

import paths from "@/public/brand/fiu-logo-paths.json";

import { buildLogoGeometry, type LogoMeshMode, logoPathsSchema } from "../buildLogoGeometry";
import type { LogoGlassParams } from "../config/schemas";
import { CAMERA_Z } from "./shared";

/** The logo's paths, checked once when the 3D bundle loads. */
const LOGO_PATHS = logoPathsSchema.parse(paths);

/**
 * The logo mesh for `meshMode` (the playground can override the extrude's depth and bevel), disposed when replaced,
 * and the width of its silhouette as the camera sees it, front-facing: the front of the slab sits nearer
 * the camera than z = 0, so its edges project slightly wider than the bounding box. Sizing by this
 * makes the glass logo the width of the flat SVG logo it replaces.
 */
export function useLogoGeometry(meshMode: LogoMeshMode, extrudeOverride: LogoGlassParams["extrude"]) {
  const depth = extrudeOverride?.depth;
  const bevelThickness = extrudeOverride?.bevelThickness;
  const bevelSize = extrudeOverride?.bevelSize;

  const geometry = useMemo(() => {
    const base = LOGO_PATHS;
    if (
      meshMode === "extrude"
      && base.extrude
      && depth !== undefined
      && bevelThickness !== undefined
      && bevelSize !== undefined
    ) {
      return buildLogoGeometry({ ...base, extrude: { ...base.extrude, depth, bevelThickness, bevelSize } }, meshMode);
    }
    return buildLogoGeometry(base, meshMode);
  }, [meshMode, depth, bevelThickness, bevelSize]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const modelWidth = useMemo(() => {
    const pos = geometry.getAttribute("position");
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = (pos.getX(i) * CAMERA_Z) / (CAMERA_Z - pos.getZ(i));
      if (x < min) min = x;
      if (x > max) max = x;
    }
    return max - min;
  }, [geometry]);

  return { geometry, modelWidth };
}
