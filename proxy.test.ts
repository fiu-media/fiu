import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const run = (path: string, init?: { headers?: Record<string, string>; method?: string }) =>
  proxy(new NextRequest(`https://fiu.test${path}`, init));
const asking = (acceptLanguage: string) => ({ headers: { "accept-language": acceptLanguage } });
const choosing = (language: string, acceptLanguage?: string) => ({
  headers: { cookie: `fiu-lang=${language}`, ...(acceptLanguage ? { "accept-language": acceptLanguage } : {}) },
});

describe("proxy", () => {
  it("redirects the explicit default-locale URL to the unprefixed one", () => {
    const response = run("/en/about?x=1");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://fiu.test/about?x=1");
  });

  it("redirects /en to the root", () => {
    const response = run("/en");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://fiu.test/");
  });

  it("rewrites unprefixed paths to the default locale without changing the URL", () => {
    const response = run("/about");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
    expect(response.headers.get("location")).toBeNull();
  });

  it("rewrites the root to /en", () => {
    expect(run("/").headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en");
  });

  it("does not treat a path that merely starts with the locale code as prefixed", () => {
    expect(run("/english").headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/english");
  });

  describe("language detection", () => {
    it("sends a browser that prefers Irish to the Irish page, keeping the query", () => {
      const response = run("/work?x=1", asking("ga-IE,ga;q=0.9,en;q=0.5"));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://fiu.test/ga/work?x=1");
      expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    });

    it("sends the root to /ga", () => {
      expect(run("/", asking("ga")).headers.get("location")).toBe("https://fiu.test/ga");
    });

    it("leaves a browser that ranks English first, or names no language, on English", () => {
      for (const init of [asking("en-IE,en;q=0.9,ga;q=0.8"), asking("fr-FR,fr;q=0.9"), asking("*"), {}]) {
        const response = run("/work", init);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/work");
      }
    });

    it("lets an explicit choice beat the browser, in both directions", () => {
      const toEnglish = run("/work", choosing("en", "ga"));
      expect(toEnglish.headers.get("location")).toBeNull();
      expect(toEnglish.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/work");
      expect(run("/work", choosing("ga", "en")).headers.get("location")).toBe("https://fiu.test/ga/work");
    });

    it("ignores a cookie that names no known language", () => {
      expect(run("/work", choosing("xx", "ga")).headers.get("location")).toBe("https://fiu.test/ga/work");
      expect(run("/work", choosing("xx", "en")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/work");
    });

    it("never moves a prefixed URL, whatever the browser prefers", () => {
      expect(run("/ga/work", asking("en")).headers.get("location")).toBeNull();
      expect(run("/ga/work", choosing("en", "en")).headers.get("location")).toBeNull();
    });

    it("leaves form posts alone", () => {
      const response = run("/contact", { ...asking("ga"), method: "POST" });
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/contact");
    });
  });
});
