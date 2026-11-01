import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, languageAlternates, localizedPath, locales } from "./config";

describe("isLocale", () => {
  it("recognises configured locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ga")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("localizedPath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localizedPath(defaultLocale, "/")).toBe("/");
    expect(localizedPath(defaultLocale, "/about")).toBe("/about");
  });
});

describe("languageAlternates", () => {
  it("lists every locale plus x-default, with the canonical in the page's own locale", () => {
    const alternates = languageAlternates(defaultLocale, "/contact");
    const languages: Record<string, string> = alternates.languages;
    expect(alternates.canonical).toBe("/contact");
    expect(languages["x-default"]).toBe("/contact");
    for (const locale of locales) expect(languages[locale]).toBe(localizedPath(locale, "/contact"));
  });
});
