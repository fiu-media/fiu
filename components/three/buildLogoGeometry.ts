import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type LogoMeshMode = "tubes" | "extrude";

export type LogoStroke = {
  /** Centreline samples: [x, y, radius] in logo-world units. */
  points: number[][];
  closed?: boolean;
  /** End treatments — `point` already tapers to ~0 in the radius data. */
  caps?: ("flat" | "point")[];
};

export type LogoPaths = {
  strokes: LogoStroke[];
  /** Flat silhouette extrude (compare mode). */
  extrude?: {
    depth: number;
    bevelThickness: number;
    bevelSize: number;
    bevelSegments: number;
  };
  shapes?: { outer: number[][]; holes: number[][][] }[];
  diamonds: { corners: number[][]; depth: number; bevel: number }[];
  /** Sheared f-tip cut: edge angle in logo plane (y-up). Flat tube caps use this. */
  tipCut?: { angle: number; side: number };
};

const RADIAL = 10;
const MIN_R = 0.002;

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

/** Cap-plane normal for a sheared tip cut: edge runs at `tipCutAngle` in the logo plane. */
function tipCutNormal(tipCutAngle: number, along: THREE.Vector3): THREE.Vector3 {
  const n = new THREE.Vector3(Math.cos(tipCutAngle + Math.PI / 2), Math.sin(tipCutAngle + Math.PI / 2), 0);
  if (n.dot(along) < 0) n.negate();
  return n.normalize();
}

/** Rewrite a tube ring so it lies in a plane with the given normal (oblique tip slice). */
function rewriteRing(
  positions: number[],
  ringStart: number,
  origin: THREE.Vector3,
  radius: number,
  normal: THREE.Vector3,
  preferB: THREE.Vector3,
) {
  const N = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 0, 1));
  if (N.lengthSq() < 1e-8) N.crossVectors(normal, new THREE.Vector3(0, 1, 0));
  N.normalize();
  const B = new THREE.Vector3().crossVectors(normal, N).normalize();
  if (B.dot(preferB) < 0) {
    N.negate();
    B.negate();
  }
  for (let j = 0; j < RADIAL; j++) {
    const a = (j / RADIAL) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const i = (ringStart + j) * 3;
    positions[i] = origin.x + (N.x * c + B.x * s) * radius;
    positions[i + 1] = origin.y + (N.y * c + B.y * s) * radius;
    positions[i + 2] = origin.z + (N.z * c + B.z * s) * radius;
  }
}

/**
 * Round variable-radius tube along a 2D centreline (z = 0).
 * Local depth follows width the way liquid-glass does — fat belly, needle tips.
 * Flat caps are sheared to `tipCutAngle` so their silhouette matches the artwork cut
 * (and the diamond short edges).
 */
function variableRadiusTube(stroke: LogoStroke, tipCutAngle?: number): THREE.BufferGeometry {
  const raw = stroke.points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (raw.length < 2) throw new Error("stroke needs ≥2 points");

  // Drop near-duplicates so tangents stay stable.
  const samples: { x: number; y: number; r: number }[] = [{ x: raw[0][0], y: raw[0][1], r: Math.max(raw[0][2], MIN_R) }];
  for (let i = 1; i < raw.length; i++) {
    const prev = samples[samples.length - 1];
    const dx = raw[i][0] - prev.x;
    const dy = raw[i][1] - prev.y;
    if (dx * dx + dy * dy < 1e-8) {
      prev.r = Math.max(prev.r, raw[i][2], MIN_R);
      continue;
    }
    samples.push({ x: raw[i][0], y: raw[i][1], r: Math.max(raw[i][2], MIN_R) });
  }
  if (samples.length < 2) throw new Error("stroke collapsed");

  const closed = Boolean(stroke.closed);
  const n = samples.length;
  const origins: THREE.Vector3[] = samples.map((s) => new THREE.Vector3(s.x, s.y, 0));
  const radii = samples.map((s) => s.r);

  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    let t: THREE.Vector3;
    if (closed) {
      t = origins[(i + 1) % n].clone().sub(origins[(i - 1 + n) % n]);
    } else if (i === 0) {
      t = origins[1].clone().sub(origins[0]);
    } else if (i === n - 1) {
      t = origins[n - 1].clone().sub(origins[n - 2]);
    } else {
      t = origins[i + 1].clone().sub(origins[i - 1]);
    }
    if (t.lengthSq() < 1e-12) t.set(1, 0, 0);
    else t.normalize();
    tangents.push(t);
  }

  // Parallel-transport frames — avoids Frenet twist on planar paths.
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];
  {
    const t0 = tangents[0];
    // Prefer binormal ≈ +Z so the round profile pillows toward the camera.
    const n0 = new THREE.Vector3().crossVectors(t0, new THREE.Vector3(0, 0, 1));
    if (n0.lengthSq() < 1e-8) n0.crossVectors(t0, new THREE.Vector3(0, 1, 0));
    n0.normalize();
    const b0 = new THREE.Vector3().crossVectors(t0, n0).normalize();
    if (b0.z < 0) {
      n0.negate();
      b0.negate();
    }
    normals.push(n0);
    binormals.push(b0);
  }
  const axis = new THREE.Vector3();
  for (let i = 1; i < n; i++) {
    const prevT = tangents[i - 1];
    const t = tangents[i];
    const nPrev = normals[i - 1].clone();
    axis.crossVectors(prevT, t);
    const axisLen = axis.length();
    if (axisLen > 1e-8) {
      const angle = Math.acos(THREE.MathUtils.clamp(prevT.dot(t), -1, 1));
      nPrev.applyAxisAngle(axis.multiplyScalar(1 / axisLen), angle);
    }
    // Re-orthonormalize against current tangent.
    const b = new THREE.Vector3().crossVectors(t, nPrev).normalize();
    const nn = new THREE.Vector3().crossVectors(b, t).normalize();
    normals.push(nn);
    binormals.push(b);
  }

  const positions: number[] = [];
  const ringIndex: number[] = [];
  for (let i = 0; i < n; i++) {
    ringIndex.push(positions.length / 3);
    const o = origins[i];
    const N = normals[i];
    const B = binormals[i];
    const r = radii[i];
    for (let j = 0; j < RADIAL; j++) {
      const a = (j / RADIAL) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      positions.push(o.x + (N.x * c + B.x * s) * r, o.y + (N.y * c + B.y * s) * r, o.z + (N.z * c + B.z * s) * r);
    }
  }

  const caps = stroke.caps ?? ["flat", "flat"];
  // Oblique tip slices: ring + cap share the artwork tip-cut plane (// diamond sides).
  const startCut =
    !closed && caps[0] === "flat" && tipCutAngle != null
      ? tipCutNormal(tipCutAngle, tangents[0])
      : null;
  const endCut =
    !closed && caps[caps.length - 1] === "flat" && tipCutAngle != null
      ? tipCutNormal(tipCutAngle, tangents[n - 1])
      : null;
  if (startCut) rewriteRing(positions, ringIndex[0], origins[0], radii[0], startCut, binormals[0]);
  if (endCut) rewriteRing(positions, ringIndex[n - 1], origins[n - 1], radii[n - 1], endCut, binormals[n - 1]);

  const indices: number[] = [];
  const rings = closed ? n : n - 1;
  for (let i = 0; i < rings; i++) {
    const a = ringIndex[i];
    const b = ringIndex[(i + 1) % n];
    for (let j = 0; j < RADIAL; j++) {
      const j2 = (j + 1) % RADIAL;
      const a0 = a + j;
      const a1 = a + j2;
      const b0 = b + j;
      const b1 = b + j2;
      indices.push(a0, b0, a1, a1, b0, b1);
    }
  }

  if (!closed) {
    if (caps[0] === "flat") addFlatCap(positions, indices, ringIndex[0], origins[0], startCut ?? tangents[0], true);
    else addPointCap(positions, indices, ringIndex[0], origins[0], tangents[0], true);
    if (caps[caps.length - 1] === "flat") {
      addFlatCap(positions, indices, ringIndex[n - 1], origins[n - 1], endCut ?? tangents[n - 1], false);
    } else {
      addPointCap(positions, indices, ringIndex[n - 1], origins[n - 1], tangents[n - 1], false);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Flat end cap with its own rim verts (not shared with the tube wall) so
 * computeVertexNormals doesn't smear wall/cap normals — and with both windings
 * so the tip stays solid when the camera swings behind it.
 */
function addFlatCap(
  positions: number[],
  indices: number[],
  ringStart: number,
  origin: THREE.Vector3,
  tangent: THREE.Vector3,
  start: boolean,
) {
  const outward = tangent.clone().normalize().multiplyScalar(start ? -1 : 1);
  const nudge = outward.clone().multiplyScalar(1e-3);
  // Duplicate the rim so cap normals stay independent of the tube wall.
  const rimStart = positions.length / 3;
  for (let j = 0; j < RADIAL; j++) {
    const i = (ringStart + j) * 3;
    positions.push(positions[i] + nudge.x, positions[i + 1] + nudge.y, positions[i + 2] + nudge.z);
  }
  const center = positions.length / 3;
  positions.push(origin.x + nudge.x * 2, origin.y + nudge.y * 2, origin.z + nudge.z * 2);
  for (let j = 0; j < RADIAL; j++) {
    const j2 = (j + 1) % RADIAL;
    const a = rimStart + j;
    const b = rimStart + j2;
    // Outward face + inward face (two-sided without relying on material.side).
    indices.push(center, a, b, center, b, a);
  }
}

/** Seal a needle tip so you can't see into the hollow tube when rotating. */
function addPointCap(
  positions: number[],
  indices: number[],
  ringStart: number,
  origin: THREE.Vector3,
  tangent: THREE.Vector3,
  start: boolean,
) {
  const outward = tangent.clone().normalize().multiplyScalar(start ? -1 : 1);
  // Tip sits just past the last ring; radius there is already ~0.
  const tip = positions.length / 3;
  const dist = 1e-3;
  positions.push(origin.x + outward.x * dist, origin.y + outward.y * dist, origin.z + outward.z * dist);
  for (let j = 0; j < RADIAL; j++) {
    const j2 = (j + 1) % RADIAL;
    const a = ringStart + j;
    const b = ringStart + j2;
    indices.push(tip, a, b, tip, b, a);
  }
}

/** Drop anything mergeGeometries won't accept across tube + Extrude parts. */
function forMerge(g: THREE.BufferGeometry): THREE.BufferGeometry {
  // Tubes are indexed; ExtrudeGeometry in current Three is not — normalize to non-indexed.
  const out = g.index ? g.toNonIndexed() : g;
  if (out !== g) g.dispose();
  for (const name of Object.keys(out.attributes)) {
    if (name !== "position" && name !== "normal") out.deleteAttribute(name);
  }
  return out;
}

function buildDiamonds(diamonds: LogoPaths["diamonds"]): THREE.BufferGeometry[] {
  return diamonds.map((d) => {
    const shape = shapeFromRing(d.corners);
    // Hard faceted chamfer (bevelSegments: 1) like the liquid-glass gems.
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: d.depth,
      bevelEnabled: true,
      bevelThickness: d.bevel,
      bevelSize: d.bevel,
      bevelSegments: 1,
      curveSegments: 1,
    });
    g.translate(0, 0, -d.depth / 2);
    return forMerge(g);
  });
}

/** Rounded extrusion of the flat mark — filleted edges like liquid-glass. */
function buildExtrudedBody(paths: LogoPaths): THREE.BufferGeometry[] {
  const extrude = paths.extrude;
  const shapes = paths.shapes;
  if (!extrude || !shapes?.length) throw new Error("paths JSON missing extrude shapes");

  const { depth, bevelThickness, bevelSize, bevelSegments } = extrude;
  const parts: THREE.BufferGeometry[] = [];

  for (const s of shapes) {
    const shape = shapeFromRing(s.outer);
    for (const hole of s.holes) {
      const h = new THREE.Path();
      const [x0, y0] = hole[0];
      h.moveTo(x0, y0);
      for (let i = 1; i < hole.length; i++) h.lineTo(hole[i][0], hole[i][1]);
      h.closePath();
      shape.holes.push(h);
    }
    // High bevelSegments → smooth fillet (pillow edge); diamonds keep a harder chamfer.
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments: 4,
    });
    g.translate(0, 0, -depth / 2);
    parts.push(forMerge(g));
  }
  return parts;
}

/**
 * Build the logo mesh.
 * - `tubes` — pure variable-radius centreline tubes (liquid-glass taper).
 * - `extrude` — constant-depth silhouette extrude (compare mode).
 */
export function buildLogoGeometry(paths: LogoPaths, mode: LogoMeshMode = "tubes"): THREE.BufferGeometry {
  const tipCutAngle = paths.tipCut?.angle;
  const parts: THREE.BufferGeometry[] =
    mode === "extrude"
      ? buildExtrudedBody(paths)
      : paths.strokes.map((s) => forMerge(variableRadiusTube(s, tipCutAngle)));

  parts.push(...buildDiamonds(paths.diamonds));

  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) throw new Error("Failed to merge logo geometries");
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  // Paths JSON is already centered on the body (diamonds excluded) so the live mesh
  // lines up with the PNG fallback — don't re-center on the diamond-expanded bbox.
  return merged;
}
