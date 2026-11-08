import { describe, expect, it } from "vitest";

import { localeOfPath } from "./NotFoundLocale";

describe("localeOfPath", () => {
  it("reads the language prefix", () => {
    expect(localeOfPath("/ga")).toBe("ga");
    expect(localeOfPath("/ga/work/unknown")).toBe("ga");
  });
  it("is English without a prefix", () => {
    expect(localeOfPath("/")).toBe("en");
    expect(localeOfPath("/unknown")).toBe("en");
    expect(localeOfPath("")).toBe("en");
  });
});
