import { describe, expect, it } from "vitest";

import { omitUndefined } from "./omitUndefined";

describe("omitUndefined", () => {
  it("drops undefined values and keeps everything else", () => {
    expect(omitUndefined({ a: 1, b: undefined, c: "", d: null, e: false })).toEqual({ a: 1, c: "", d: null, e: false });
  });

  it("leaves the key out rather than setting it to undefined", () => {
    expect("b" in omitUndefined({ b: undefined })).toBe(false);
  });
});
