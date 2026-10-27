import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type LogoPaths = {
  extrude: {
    depth: number;
    bevelThickness: number;
    bevelSize: number;
    bevelSegments: number;
  };
  shapes: { outer: number[][]; holes: number[][][] }[];
  diamonds: { corners: number[][]; depth: number; bevel: number }[];
};

function shapeFromRing(ring: number[][]) {
  const shape = new THREE.Shape();
  const [x0, y0] = ring[0];
  shape.moveTo(x0, y0);
  for (let i = 1; i < ring.length; i++) {
    shape.lineTo(ring[i][0], ring[i][1]);
  }
  shape.closePath();
  return shape;
}

/** Rounded extrusion of the flat mark — overlaps are one solid, not crossing tubes. */
export function buildLogoGeometry(paths: LogoPaths): THREE.BufferGeometry {
  const { depth, bevelThickness, bevelSize, bevelSegments } = paths.extrude;
  const parts: THREE.BufferGeometry[] = [];

  for (const s of paths.shapes) {
    const shape = shapeFromRing(s.outer);
    for (const hole of s.holes) {
      const h = new THREE.Path();
      const [x0, y0] = hole[0];
      h.moveTo(x0, y0);
      for (let i = 1; i < hole.length; i++) h.lineTo(hole[i][0], hole[i][1]);
      h.closePath();
      shape.holes.push(h);
    }
    // Shape is already x-right / y-up; extrude along Z so the logo faces the camera.
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments: 1,
    });
    g.translate(0, 0, -depth / 2);
    parts.push(g);
  }

  for (const d of paths.diamonds) {
    const shape = shapeFromRing(d.corners);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: d.depth,
      bevelEnabled: true,
      bevelThickness: d.bevel,
      bevelSize: d.bevel,
      bevelSegments: 2,
      curveSegments: 1,
    });
    g.translate(0, 0, -d.depth / 2);
    parts.push(g);
  }

  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) throw new Error("Failed to merge logo geometries");
  // Keep only position + normal for transmission.
  for (const name of Object.keys(merged.attributes)) {
    if (name !== "position" && name !== "normal") merged.deleteAttribute(name);
  }
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  // Paths JSON is already centered on the body (diamonds excluded) so the live mesh
  // lines up with the PNG fallback — don't re-center on the diamond-expanded bbox.
  return merged;
}
