import * as THREE from "three";

export const BACKDROP_Z = -4;
// A distant, narrow camera keeps the slab's front face from projecting wider than its back, so the
// front-facing glass logo matches the flat SVG logo's outline (at 12 it overlapped the artwork by
// 82%, at 48 by 93%). The fov is chosen so the view at z = 0 is the same size as the old fov-30
// camera at z = 12, i.e. everything else keeps its size.
export const CAMERA_Z = 48;
export const CAMERA_FOV = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(15)) * (12 / CAMERA_Z)) * 180) / Math.PI;
export const CROSSFADE_SECONDS = 1.6;

export type Fade = { from: number; to: number; start: number };
