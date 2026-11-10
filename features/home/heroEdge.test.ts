import { describe, expect, it } from "vitest";

import { contrastOfText, coverPlacement, edgeForLuminance, parsePosition, relativeLuminance, stripLuminance } from "./heroEdge";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1);
  });
});

describe("edgeForLuminance", () => {
  it("leaves dark and mid-toned edges alone", () => {
    expect(edgeForLuminance(0)).toBe(0);
    expect(edgeForLuminance(0.1)).toBe(0);
  });

  it("darkens a bright edge just enough for the rail's 80% white text to hold 4.5:1", () => {
    for (const luminance of [0.2, 0.3, 0.6, 1]) {
      const edge = edgeForLuminance(luminance);
      const darkened = luminance * (1 - edge) ** 2.2;
      expect(contrastOfText(darkened)).toBeGreaterThanOrEqual(4.5);
      // Just enough: a step lighter would fail.
      expect(edge > 0 ? contrastOfText(luminance * (1 - edge + 0.01) ** 2.2) : 0).toBeLessThan(4.8);
      expect(edge).toBeLessThan(0.7);
    }
  });

  it("needs more for dimmer text", () => {
    expect(edgeForLuminance(1, 0.8)).toBeGreaterThan(edgeForLuminance(1, 1));
  });

  it("darkens brighter edges more", () => {
    expect(edgeForLuminance(1)).toBeGreaterThan(edgeForLuminance(0.4));
  });
});

describe("stripLuminance", () => {
  // A 32×180 strip like the hook reads, dark, with bright pixels painted in.
  const strip = (paint: (row: number, col: number) => boolean) => {
    const data = new Uint8ClampedArray(32 * 180 * 4);
    for (let row = 0; row < 180; row++) {
      for (let col = 0; col < 32; col++)
        data.set(paint(row, col) ? [255, 255, 255, 255] : [20, 20, 20, 255], (row * 32 + col) * 4);
    }
    return data;
  };

  it("ignores specks of highlight", () => {
    expect(
      stripLuminance(
        strip((row, col) => row % 40 === 0 && col === 5),
        32,
      ),
    ).toBeLessThan(0.05);
  });

  it("counts a highlight the size of a word, even when it is a tiny share of the strip", () => {
    // 12×6 of 32×180: about 1% of the strip, but most of one band.
    expect(
      stripLuminance(
        strip((row, col) => row >= 160 && row < 166 && col >= 10 && col < 22),
        32,
      ),
    ).toBeCloseTo(1);
  });
});

describe("coverPlacement", () => {
  it("crops a wide image to a narrower box around its centre", () => {
    // 2000×1000 covering 1000×1000: drawn 2000×1000, 500px hanging off each side.
    expect(coverPlacement({ w: 2000, h: 1000 }, { w: 1000, h: 1000 }, { x: 0.5, y: 0.5 })).toEqual({
      x: -500,
      y: 0,
      w: 2000,
      h: 1000,
    });
  });

  it("follows the hotspot", () => {
    expect(coverPlacement({ w: 2000, h: 1000 }, { w: 1000, h: 1000 }, { x: 0, y: 0.5 }).x).toBeCloseTo(0);
  });

  it("depends only on the image's proportions, not its reported pixel size", () => {
    const box = { w: 1440, h: 900 };
    const centre = { x: 0.5, y: 0.5 };
    const full = coverPlacement({ w: 1744, h: 981 }, box, centre);
    const densityCorrected = coverPlacement({ w: 1744 / 2.5, h: 981 / 2.5 }, box, centre);
    expect(densityCorrected.x).toBeCloseTo(full.x);
    expect(densityCorrected.w).toBeCloseTo(full.w);
  });
});

describe("parsePosition", () => {
  it("reads an object-position in percent and centres anything else", () => {
    expect(parsePosition("25% 75%")).toEqual({ x: 0.25, y: 0.75 });
    expect(parsePosition(undefined)).toEqual({ x: 0.5, y: 0.5 });
    expect(parsePosition("left top")).toEqual({ x: 0.5, y: 0.5 });
  });
});
