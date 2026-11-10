import { describe, expect, it } from "vitest";

import { at } from "./at";

describe("at", () => {
  it("returns the element at the index", () => {
    expect(at([10, 20, 30], 1)).toBe(20);
  });

  it("throws when the index is out of range", () => {
    expect(() => at([10], 1)).toThrow(RangeError);
  });
});
