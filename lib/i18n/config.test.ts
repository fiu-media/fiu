import { describe, expect, it, vi } from "vitest";

import { defaultLocale, getLocale, isLocale, languageAlternates, locales, localizedPath, switchLocalePath } from "./config";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("isLocale", () => {
  it("recognises configured locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ga")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("getLocale", () => {
  it("returns the locale named by the route param", async () => {
    await expect(getLocale(Promise.resolve({ lang: "ga" }))).resolves.toBe("ga");
  });

  it("is a 404 for anything else", async () => {
    await expect(getLocale(Promise.resolve({ lang: "fr" }))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("localizedPath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localizedPath(defaultLocale, "/")).toBe("/");
    expect(localizedPath(defaultLocale, "/about")).toBe("/about");
  });

  it("prefixes other locales", () => {
    expect(localizedPath("ga", "/")).toBe("/ga");
    expect(localizedPath("ga", "/about")).toBe("/ga/about");
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

describe("switchLocalePath", () => {
  it("moves a page between the unprefixed default and a prefixed locale", () => {
    expect(switchLocalePath("/work", "ga")).toBe("/ga/work");
    expect(switchLocalePath("/ga/work", "en")).toBe("/work");
    expect(switchLocalePath("/", "ga")).toBe("/ga");
    expect(switchLocalePath("/ga", "en")).toBe("/");
  });

  it("keeps the page when the locale is unchanged and tolerates the empty fallback path", () => {
    expect(switchLocalePath("/ga/talent/aoife", "ga")).toBe("/ga/talent/aoife");
    expect(switchLocalePath("", "ga")).toBe("/ga");
  });

  it("does not mistake a path that merely starts with a locale code for a prefix", () => {
    expect(switchLocalePath("/gallery", "ga")).toBe("/ga/gallery");
  });
});
