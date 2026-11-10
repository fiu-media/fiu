import { afterEach, describe, expect, it, vi } from "vitest";

import { en } from "./dictionaries/en";
import { getNavItems } from "./nav";

describe("getNavItems", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/features");
    vi.resetModules();
  });

  it("links the main sections in the visitor's language, without Rentals while it is off", () => {
    expect(getNavItems("ga", en).map((item) => item.href)).toEqual(["/ga/about", "/ga/work", "/ga/talent", "/ga/contact"]);
  });

  it("adds Rentals before Contact when it is on", async () => {
    vi.resetModules();
    vi.doMock("@/lib/features", () => ({ features: { rentals: true } }));
    const { getNavItems: withRentals } = await import("./nav");
    expect(withRentals("en", en).map((item) => item.href)).toEqual(["/about", "/work", "/talent", "/rentals", "/contact"]);
  });
});
