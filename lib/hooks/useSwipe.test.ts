import { describe, expect, it } from "vitest";

import { swipeStep } from "./useSwipe";

describe("swipeStep", () => {
  it("goes forward on a swipe left and back on a swipe right", () => {
    expect(swipeStep(-60, 50)).toBe(1);
    expect(swipeStep(60, 50)).toBe(-1);
  });

  it("counts a swipe of exactly the threshold", () => {
    expect(swipeStep(-50, 50)).toBe(1);
    expect(swipeStep(40, 40)).toBe(-1);
  });

  it("ignores a drag shorter than the threshold", () => {
    expect(swipeStep(-49, 50)).toBe(0);
    expect(swipeStep(39, 40)).toBe(0);
    expect(swipeStep(0, 40)).toBe(0);
  });
});
