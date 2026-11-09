/**
 * How dark the desktop rail's edge has to get over the hero still on screen.
 *
 * The rail's labels and language codes are small text over the footage, so they need 4.5:1. At rest they are 80% white
 * (`TEXT_ALPHA`, see `.rail-halo` in globals.css), the dimmest tone in the rail, so that is the one the edge is sized
 * for. Most stills are dark or mid-toned at the left edge and need nothing; a bright one gets just enough darkening
 * under the rail to hold the ratio. The rest of the frame keeps its light either way.
 */

/** The rail's text at rest over footage: white at this opacity. */
export const TEXT_ALPHA = 0.8;
/** WCAG AA for small text (4.5), with margin for anti-aliasing and for the backdrop not being a flat grey. */
const TARGET_CONTRAST = 4.8;
/** sRGB is roughly a 2.2 power curve, so darkening a channel by `a` scales luminance by about (1 - a) ^ 2.2. */
const GAMMA = 2.2;
const STEP = 0.005;
/**
 * The strip is judged in bands about a word tall (24 down a screen, ~37px at 900px), each by its 90th percentile, and
 * the brightest band wins. A highlight the size of a word, like a candle flame behind one label, counts in full; specks
 * a few pixels across don't. A whole-strip percentile missed that flame.
 */
const BANDS = 24;
const BAND_PERCENTILE = 0.9;

export type Rect = { x: number; y: number; w: number; h: number };

/** WCAG relative luminance of an 8-bit sRGB colour. */
export function relativeLuminance(r: number, g: number, b: number) {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** "40% 60%" (an object-position from the editor's hotspot) as fractions; anything else is centred. */
export function parsePosition(position: string | undefined) {
  const match = position?.match(/^\s*([\d.]+)%\s+([\d.]+)%\s*$/);
  return match ? { x: Number(match[1]) / 100, y: Number(match[2]) / 100 } : { x: 0.5, y: 0.5 };
}

/**
 * Where an image is drawn, in the box's pixels, when it fills `box` with `object-fit: cover` at `position`. Only the
 * image's proportions matter, which keeps this right for responsive images, whose reported natural size is divided by
 * the screen's pixel density.
 */
export function coverPlacement(
  natural: { w: number; h: number },
  box: { w: number; h: number },
  position: { x: number; y: number },
): Rect {
  const scale = Math.max(box.w / natural.w, box.h / natural.h);
  const w = natural.w * scale;
  const h = natural.h * scale;
  return { x: (box.w - w) * position.x, y: (box.h - h) * position.y, w, h };
}

/** How bright the strip is where it matters: its pixels (RGBA bytes, `width` per row), by the brightest word-sized band. */
export function stripLuminance(pixels: Uint8ClampedArray, width: number) {
  const rows = Math.floor(pixels.length / 4 / width);
  if (rows === 0) return 0;
  const bandRows = Math.max(1, Math.round(rows / BANDS));
  let brightest = 0;
  for (let top = 0; top < rows; top += bandRows) {
    const values: number[] = [];
    for (let row = top; row < Math.min(rows, top + bandRows); row++) {
      for (let col = 0; col < width; col++) {
        const i = (row * width + col) * 4;
        values.push(relativeLuminance(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!));
      }
    }
    values.sort((x, y) => x - y);
    brightest = Math.max(brightest, values[Math.min(values.length - 1, Math.floor(values.length * BAND_PERCENTILE))]!);
  }
  return brightest;
}

/** The 8-bit grey with this relative luminance. */
function greyFor(luminance: number) {
  const c = luminance <= 0.0031308 ? luminance * 12.92 : 1.055 * luminance ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(Math.max(c, 0), 1) * 255);
}

/** WCAG contrast of white text at `alpha`, blended over a grey backdrop of this luminance, against that backdrop. */
export function contrastOfText(backdrop: number, alpha = TEXT_ALPHA) {
  const grey = greyFor(backdrop);
  const text = alpha * 255 + (1 - alpha) * grey;
  return (relativeLuminance(text, text, text) + 0.05) / (backdrop + 0.05);
}

/** The black overlay (0 to 1) a backdrop this bright needs for the rail's text over it to hold 4.5:1. */
export function edgeForLuminance(luminance: number, alpha = TEXT_ALPHA) {
  for (let edge = 0; edge < 1; edge += STEP) {
    if (contrastOfText(luminance * (1 - edge) ** GAMMA, alpha) >= TARGET_CONTRAST) return Math.round(edge * 1000) / 1000;
  }
  return 1;
}
