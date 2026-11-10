import { afterEach, describe, expect, it, vi } from "vitest";

import { botIdProtectedPaths } from "./botid";

describe("botIdProtectedPaths", () => {
  it("covers the contact page in every locale, and nothing else while Rentals is off", () => {
    expect(botIdProtectedPaths.map((entry) => entry.path)).toEqual(["/contact", "/ga/contact"]);
  });

  it("protects POSTs only", () => {
    expect(botIdProtectedPaths.every((entry) => entry.method === "POST")).toBe(true);
  });
});

describe("botIdProtectedPaths with Rentals on", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/features");
    vi.resetModules();
  });

  it("also covers the quote form in every locale", async () => {
    vi.resetModules();
    vi.doMock("@/lib/features", () => ({ features: { rentals: true } }));
    const { botIdProtectedPaths: paths } = await import("./botid");
    expect(paths.map((entry) => entry.path)).toEqual(
      expect.arrayContaining(["/contact", "/ga/contact", "/rentals/quote", "/ga/rentals/quote"]),
    );
  });
});
