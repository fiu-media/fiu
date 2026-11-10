import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const SAMPLE_SIZE = 32;
export const NEUTRAL_TINT = new THREE.Color("#c8c4c0");

export type SceneStill = {
  src: string;
  width: number;
  height: number;
  /** CMS-provided studio tint (hex). Prefer this over client sampling — CORS-safe. */
  lightTint?: string | undefined;
};

/** Same cache key as `useTexture([src])` in Scene. */
export function preloadStill(src: string) {
  useTexture.preload([src]);
}

export function configureStill(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Prefer CMS `lightTint`; else sample the texture; else neutral. Sampling failures (CORS) fall through. */
export function resolveStillTint(still: SceneStill, texture?: THREE.Texture): THREE.Color {
  if (still.lightTint) {
    try {
      return new THREE.Color(still.lightTint);
    } catch {
      /* fall through */
    }
  }
  if (texture?.image) {
    const sampled = sampleAverageColor(texture);
    if (sampled) return sampled;
  }
  return NEUTRAL_TINT.clone();
}

/** Downsample and average. Returns null if the image can't be read (tainted / not ready). */
function sampleAverageColor(texture: THREE.Texture): THREE.Color | null {
  const img = texture.image as CanvasImageSource | undefined;
  if (!img || typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    let r = 0;
    let g = 0;
    let b = 0;
    let w = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lr = data[i]! / 255;
      const lg = data[i + 1]! / 255;
      const lb = data[i + 2]! / 255;
      // Bright pixels weigh more — they dominate how glass reads temperature.
      const lum = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      const weight = 0.2 + lum * lum;
      r += lr * weight;
      g += lg * weight;
      b += lb * weight;
      w += weight;
    }
    if (w < 1e-6) return null;

    const color = new THREE.Color(r / w, g / w, b / w);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    // Push chroma so glass reflections read the still's temperature clearly.
    color.setHSL(hsl.h, Math.min(0.75, Math.max(0.35, hsl.s * 1.6)), THREE.MathUtils.clamp(hsl.l, 0.32, 0.58));
    return color;
  } catch {
    return null;
  }
}
