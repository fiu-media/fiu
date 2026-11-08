import { describe, expect, it } from "vitest";

import { locales, localizedPath } from "@/lib/i18n/config";

import { botIdProtectedPaths } from "./botid";

describe("botIdProtectedPaths", () => {
  it("covers every form page in every locale", () => {
    const paths = botIdProtectedPaths.map((entry) => entry.path);
    for (const lang of locales) {
      expect(paths).toContain(localizedPath(lang, "/contact"));
      expect(paths).toContain(localizedPath(lang, "/rentals/quote"));
    }
  });

  it("includes the Irish pages", () => {
    const paths = botIdProtectedPaths.map((entry) => entry.path);
    expect(paths).toEqual(expect.arrayContaining(["/contact", "/ga/contact", "/rentals/quote", "/ga/rentals/quote"]));
  });

  it("protects POSTs only", () => {
    expect(botIdProtectedPaths.every((entry) => entry.method === "POST")).toBe(true);
  });
});
