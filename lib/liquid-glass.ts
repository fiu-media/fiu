/**
 * Displacement maps for the liquid-glass lens effect.
 *
 * Each glass shape is modelled as a slab whose rim rounds off in a circular arc. A view ray
 * hitting the rim is bent toward the shape's centre (Snell's law, n = 1.5), so pixels
 * near the edge sample the backdrop from further inside. That magnifies and bends it the
 * way Apple's Liquid Glass does. The flat middle passes the backdrop through untouched.
 *
 * The map packs that offset into an image for SVG feDisplacementMap: red = x, green = y,
 * 128 = no offset. The feDisplacementMap `scale` turns the offset into pixels.
 */

const IOR = 1.5;
const cache = new Map<string, string>();

export type LensOptions = {
  width: number;
  height: number;
  /** Corner radius in px. Use height / 2 for a capsule. */
  radius: number;
  /** Width of the curved rim in px. */
  bezel: number;
};

/** Signed distance to a rounded rectangle centred at the origin (negative inside). */
function sdRoundedRect(px: number, py: number, hw: number, hh: number, r: number) {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Rim profile: 0 at the outer edge, 1 where the flat top begins. A circular arc spreads the
 * bend across the whole rim; a squircle packs nearly all of it into the outermost pixel.
 */
function height(t: number) {
  return Math.sqrt(1 - (1 - t) * (1 - t));
}

/** Lateral offset (relative units) of a refracted vertical ray at rim position t. */
function bend(t: number) {
  const dt = 1e-3;
  const slope = (height(Math.min(t + dt, 1)) - height(Math.max(t - dt, 0))) / (2 * dt);
  const incidence = Math.atan(slope);
  const refracted = Math.asin(Math.sin(incidence) / IOR);
  return Math.tan(incidence - refracted);
}

// Normalise against the largest bend so the map uses its full range.
const SAMPLES = 64;
const bendTable = Array.from({ length: SAMPLES + 1 }, (_, i) => bend(Math.max(i / SAMPLES, 0.02)));
const maxBend = Math.max(...bendTable);

function bendAt(t: number) {
  const x = Math.min(Math.max(t, 0), 1) * SAMPLES;
  const i = Math.floor(x);
  const f = x - i;
  const a = bendTable[i];
  const b = bendTable[Math.min(i + 1, SAMPLES)];
  // Perceptual lift so the magnification reads across the rim, not just at its lip.
  return Math.pow((a + (b - a) * f) / maxBend, 0.7);
}

export function displacementMap({ width, height: h, radius, bezel }: LensOptions): string {
  const w = Math.max(1, Math.round(width));
  const hh = Math.max(1, Math.round(h));
  const r = Math.min(radius, w / 2, hh / 2);
  const key = `${w}x${hh}r${r}b${bezel}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = hh;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, hh);
  const data = img.data;
  const halfW = w / 2;
  const halfH = hh / 2;
  const e = 0.75;

  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const d = sdRoundedRect(px, py, halfW, halfH, r);
      let dx = 0;
      let dy = 0;
      if (d < 0 && -d < bezel) {
        // Inward direction = negative SDF gradient.
        const gx = sdRoundedRect(px + e, py, halfW, halfH, r) - sdRoundedRect(px - e, py, halfW, halfH, r);
        const gy = sdRoundedRect(px, py + e, halfW, halfH, r) - sdRoundedRect(px, py - e, halfW, halfH, r);
        const len = Math.hypot(gx, gy) || 1;
        const m = bendAt(-d / bezel);
        dx = (-gx / len) * m;
        dy = (-gy / len) * m;
      }
      const i = (y * w + x) * 4;
      data[i] = 128 + dx * 127;
      data[i + 1] = 128 + dy * 127;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

/**
 * Only Chromium applies SVG filters inside backdrop-filter, and only Chromium exposes
 * navigator.userAgentData. The root layout's inline script sets this attribute before paint.
 */
export function supportsLensing() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-glass-refract");
}
