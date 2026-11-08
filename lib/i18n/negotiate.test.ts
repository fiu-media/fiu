import { describe, expect, it } from "vitest";

import { preferredLocale } from "./negotiate";

describe("preferredLocale", () => {
  it("returns null without a usable header", () => {
    expect(preferredLocale(null)).toBeNull();
    expect(preferredLocale("")).toBeNull();
    expect(preferredLocale("fr-FR,fr;q=0.9,de;q=0.5")).toBeNull();
    expect(preferredLocale("*")).toBeNull();
  });

  it("matches on the primary language, ignoring region and case", () => {
    expect(preferredLocale("ga-IE")).toBe("ga");
    expect(preferredLocale("GA")).toBe("ga");
    expect(preferredLocale("en-GB")).toBe("en");
  });

  it("prefers whichever supported language ranks first", () => {
    expect(preferredLocale("en-IE,en;q=0.9,ga;q=0.8")).toBe("en");
    expect(preferredLocale("ga,en;q=0.5")).toBe("ga");
    expect(preferredLocale("en;q=0.4,ga;q=0.9")).toBe("ga");
  });

  it("ranks equal weights by position", () => {
    expect(preferredLocale("ga;q=0.8,en;q=0.8")).toBe("ga");
    expect(preferredLocale("en,ga")).toBe("en");
  });

  it("skips unsupported languages ahead of a supported one", () => {
    expect(preferredLocale("fr,ga;q=0.9,en;q=0.8")).toBe("ga");
  });

  it("ignores languages the browser refuses (q=0) and malformed weights", () => {
    expect(preferredLocale("ga;q=0,en;q=0.5")).toBe("en");
    expect(preferredLocale("ga;q=oops,en;q=0.5")).toBe("ga");
  });
});
