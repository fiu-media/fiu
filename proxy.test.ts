import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { signSession } from "@/lib/gate/session";

import { proxy } from "./proxy";

const mocks = vi.hoisted(() => ({
  env: {
    SITE_GATE: undefined as "on" | "off" | undefined,
    VERCEL_ENV: undefined as string | undefined,
    AUTH_SECRET: "k".repeat(32),
  },
  launchAt: null as Date | null,
}));
vi.mock("@/env", () => ({ env: mocks.env }));
vi.mock("@/content/launchGate", () => ({ getLaunchAt: () => Promise.resolve(mocks.launchAt) }));

const run = (path: string, init?: { headers?: Record<string, string>; method?: string }) =>
  proxy(new NextRequest(`https://fiu.test${path}`, init));
const asking = (acceptLanguage: string) => ({ headers: { "accept-language": acceptLanguage } });
const choosing = (language: string, acceptLanguage?: string) => ({
  headers: { cookie: `fiu-lang=${language}`, ...(acceptLanguage ? { "accept-language": acceptLanguage } : {}) },
});

describe("proxy", () => {
  it("redirects the explicit default-locale URL to the unprefixed one", async () => {
    const response = await run("/en/about?x=1");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://fiu.test/about?x=1");
  });

  it("redirects /en to the root", async () => {
    const response = await run("/en");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://fiu.test/");
  });

  it("rewrites unprefixed paths to the default locale without changing the URL", async () => {
    const response = await run("/about");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
    expect(response.headers.get("location")).toBeNull();
  });

  it("rewrites the root to /en", async () => {
    expect((await run("/")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en");
  });

  it("does not treat a path that merely starts with the locale code as prefixed", async () => {
    expect((await run("/english")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/english");
  });

  describe("language detection", () => {
    it("sends a browser that prefers Irish to the Irish page, keeping the query", async () => {
      const response = await run("/work?x=1", asking("ga-IE,ga;q=0.9,en;q=0.5"));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://fiu.test/ga/work?x=1");
      expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    });

    it("sends the root to /ga", async () => {
      expect((await run("/", asking("ga"))).headers.get("location")).toBe("https://fiu.test/ga");
    });

    it("leaves a browser that ranks English first, or names no language, on English", async () => {
      for (const init of [asking("en-IE,en;q=0.9,ga;q=0.8"), asking("fr-FR,fr;q=0.9"), asking("*"), {}]) {
        const response = await run("/work", init);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/work");
      }
    });

    it("lets an explicit choice beat the browser, in both directions", async () => {
      const toEnglish = await run("/work", choosing("en", "ga"));
      expect(toEnglish.headers.get("location")).toBeNull();
      expect(toEnglish.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/work");
      expect((await run("/work", choosing("ga", "en"))).headers.get("location")).toBe("https://fiu.test/ga/work");
    });

    it("ignores a cookie that names no known language", async () => {
      expect((await run("/work", choosing("xx", "ga"))).headers.get("location")).toBe("https://fiu.test/ga/work");
      expect((await run("/work", choosing("xx", "en"))).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/work");
    });

    it("never moves a prefixed URL, whatever the browser prefers", async () => {
      expect((await run("/ga/work", asking("en"))).headers.get("location")).toBeNull();
      expect((await run("/ga/work", choosing("en", "en"))).headers.get("location")).toBeNull();
    });

    it("leaves form posts alone", async () => {
      const response = await run("/contact", { ...asking("ga"), method: "POST" });
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/contact");
    });
  });

  describe("launch gate", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    const future = new Date("2999-01-01T00:00:00Z");
    const gateOn = (launchAt: Date | null) => {
      mocks.env.SITE_GATE = "on";
      mocks.launchAt = launchAt;
    };
    const withSession = async () => ({
      headers: { cookie: `fiu-session=${await signSession("a@xn--fi-ska.ie", mocks.env.AUTH_SECRET)}` },
    });

    afterEach(() => {
      mocks.env.SITE_GATE = undefined;
      mocks.env.VERCEL_ENV = undefined;
      mocks.launchAt = null;
    });

    it("shows the splash instead of every page before launch, whatever the language", async () => {
      gateOn(future);
      for (const path of ["/", "/about", "/ga/about", "/en/about"]) {
        const response = await proxy(new NextRequest(`https://fiu.test${path}`));
        expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/launching");
        expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
        expect(response.headers.get("cache-control")).toBe("no-store");
      }
    });

    it("stays closed while no launch date is published", async () => {
      gateOn(null);
      expect((await run("/about")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/launching");
    });

    it("opens to everyone once the date has passed", async () => {
      gateOn(past);
      expect((await run("/about")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
    });

    it("lets a signed-in member of staff, and an editor in draft mode, through before launch", async () => {
      gateOn(future);
      expect((await run("/about", await withSession())).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
      expect((await run("/about", { headers: { cookie: "__prerender_bypass=abc" } })).headers.get("x-middleware-rewrite")).toBe(
        "https://fiu.test/en/about",
      );
    });

    it("does not accept a session signed with another key", async () => {
      gateOn(future);
      const forged = await signSession("a@xn--fi-ska.ie", "z".repeat(32));
      const response = await run("/about", { headers: { cookie: `fiu-session=${forged}` } });
      expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/launching");
    });

    it("keeps /dev for signed-in staff after launch, sending everyone else to sign in and back", async () => {
      gateOn(past);
      for (const path of ["/dev/specimen", "/ga/dev", "/en/dev"]) {
        const response = await run(`${path}?x=1`, { headers: { cookie: "__prerender_bypass=abc" } });
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          `https://fiu.test/api/auth/google?next=${encodeURIComponent(`${path}?x=1`)}`,
        );
      }
      expect((await run("/dev/specimen", await withSession())).headers.get("x-middleware-rewrite")).toBe(
        "https://fiu.test/en/dev/specimen",
      );
      expect((await run("/devices")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/devices");
    });

    it("is on in production and off elsewhere unless forced", async () => {
      mocks.launchAt = future;
      mocks.env.VERCEL_ENV = "production";
      expect((await run("/about")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/launching");
      mocks.env.VERCEL_ENV = "preview";
      expect((await run("/about")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
      mocks.env.VERCEL_ENV = "production";
      mocks.env.SITE_GATE = "off";
      expect((await run("/about")).headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
    });
  });
});
