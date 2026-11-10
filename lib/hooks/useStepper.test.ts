import { describe, expect, it } from "vitest";

import { stepTarget, wrapIndex } from "./useStepper";

describe("wrapIndex", () => {
  it("leaves an index inside the range alone", () => {
    expect(wrapIndex(2, 5)).toBe(2);
  });

  it("wraps past either end", () => {
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-1, 5)).toBe(4);
  });
});

describe("stepTarget", () => {
  it("steps by one with the arrow keys", () => {
    expect(stepTarget("ArrowRight", 2, 5)).toBe(3);
    expect(stepTarget("ArrowLeft", 2, 5)).toBe(1);
  });

  it("jumps to the ends with Home and End", () => {
    expect(stepTarget("Home", 3, 5)).toBe(0);
    expect(stepTarget("End", 1, 5)).toBe(4);
  });

  it("can step past an end, for wrapIndex to wrap", () => {
    expect(stepTarget("ArrowRight", 4, 5)).toBe(5);
    expect(stepTarget("ArrowLeft", 0, 5)).toBe(-1);
  });

  it("ignores other keys", () => {
    expect(stepTarget("Enter", 2, 5)).toBeNull();
    expect(stepTarget("a", 2, 5)).toBeNull();
  });
});
