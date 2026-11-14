import { describe, expect, it } from "vitest";

import { decideGate, gateEnabled, isDevPath } from "./decide";

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
    expect(decide({ enabled: false, pathname: "/dev" })).toBe("open");
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

  describe("/dev", () => {
    it("needs a session even after launch, and draft mode doesn't count", () => {
      expect(decide({ launchAt: past, pathname: "/dev" })).toBe("login");
      expect(decide({ launchAt: past, pathname: "/ga/dev/specimen", hasDraftCookie: true })).toBe("login");
      expect(decide({ launchAt: past, pathname: "/dev", hasSession: true })).toBe("open");
    });

    it("shows the splash before launch, like everything else", () => {
      expect(decide({ pathname: "/dev/specimen" })).toBe("splash");
      expect(decide({ pathname: "/dev/specimen", hasDraftCookie: true })).toBe("splash");
      expect(decide({ pathname: "/dev/specimen", hasSession: true })).toBe("open");
    });
  });
});

describe("isDevPath", () => {
  it.each(["/dev", "/dev/", "/dev/specimen", "/en/dev", "/ga/dev", "/ga/dev/specimen"])("matches %s", (path) => {
    expect(isDevPath(path)).toBe(true);
  });

  it.each(["/", "/devices", "/developer", "/about/dev", "/ga", "/ga/devices", "/fr/dev", "/work/dev/x"])(
    "leaves %s public",
    (path) => {
      expect(isDevPath(path)).toBe(false);
    },
  );
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
