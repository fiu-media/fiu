import { describe, expect, it } from "vitest";

import { decideGate, gateEnabled, isConceptsPath, isStaffOnlyPath } from "./decide";

const past = new Date("2020-01-01T00:00:00Z");
const future = new Date("2999-01-01T00:00:00Z");
const now = new Date("2026-11-14T12:00:00Z");

const decide = (overrides: Partial<Parameters<typeof decideGate>[0]> = {}) =>
  decideGate({
    enabled: true,
    launchAt: future,
    now,
    hasSession: false,
    hasDraftCookie: false,
    pathname: "/about",
    ...overrides,
  });

describe("decideGate", () => {
  it("does nothing when the gate is off", () => {
    expect(decide({ enabled: false })).toBe("open");
    expect(decide({ enabled: false, pathname: "/concepts" })).toBe("open");
    expect(decide({ enabled: false, pathname: "/dashboard" })).toBe("open");
  });

  it("shows the splash before launch, and while no date is published", () => {
    expect(decide()).toBe("splash");
    expect(decide({ launchAt: null })).toBe("splash");
  });

  it("opens to everyone once the date has passed, to the second", () => {
    expect(decide({ launchAt: past })).toBe("open");
    expect(decide({ launchAt: now })).toBe("open");
    expect(decide({ launchAt: new Date(now.getTime() + 1) })).toBe("splash");
  });

  it("lets staff and editors in before launch", () => {
    expect(decide({ hasSession: true })).toBe("open");
    expect(decide({ hasDraftCookie: true })).toBe("open");
  });

  describe.each(["/concepts", "/dashboard"])("%s", (root) => {
    it("needs a session even after launch, and draft mode doesn't count", () => {
      expect(decide({ launchAt: past, pathname: root })).toBe("login");
      expect(decide({ launchAt: past, pathname: `/ga${root}`, hasDraftCookie: true })).toBe("login");
      expect(decide({ launchAt: past, pathname: root, hasSession: true })).toBe("open");
    });

    it("needs a session before launch too, and draft mode still doesn't count", () => {
      expect(decide({ pathname: root })).toBe("login");
      expect(decide({ pathname: root, hasDraftCookie: true })).toBe("login");
      expect(decide({ pathname: root, hasSession: true })).toBe("open");
    });
  });
});

describe("isStaffOnlyPath", () => {
  it.each([
    "/concepts",
    "/concepts/",
    "/concepts/specimen",
    "/en/concepts",
    "/ga/concepts",
    "/ga/concepts/specimen",
    "/dashboard",
    "/dashboard/",
    "/en/dashboard",
    "/ga/dashboard",
  ])("matches %s", (path) => {
    expect(isStaffOnlyPath(path)).toBe(true);
  });

  it.each([
    "/",
    "/devices",
    "/developer",
    "/about/concepts",
    "/ga",
    "/ga/devices",
    "/fr/concepts",
    "/work/concepts/x",
    "/dashboards",
  ])("leaves %s public", (path) => {
    expect(isStaffOnlyPath(path)).toBe(false);
  });
});

describe("isConceptsPath", () => {
  it.each(["/concepts", "/concepts/", "/concepts/specimen", "/en/concepts", "/ga/concepts", "/ga/concepts/specimen"])(
    "matches %s",
    (path) => {
      expect(isConceptsPath(path)).toBe(true);
    },
  );

  it.each(["/dashboard", "/ga/dashboard", "/", "/devices", "/about/concepts"])("leaves %s alone", (path) => {
    expect(isConceptsPath(path)).toBe(false);
  });
});

describe("gateEnabled", () => {
  it("is on in production and off elsewhere", () => {
    expect(gateEnabled(undefined, "production")).toBe(true);
    expect(gateEnabled(undefined, "preview")).toBe(false);
    expect(gateEnabled(undefined, undefined)).toBe(false);
  });

  it("can be forced either way", () => {
    expect(gateEnabled("on", undefined)).toBe(true);
    expect(gateEnabled("off", "production")).toBe(false);
  });
});
