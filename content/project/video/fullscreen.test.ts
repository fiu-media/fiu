import { afterEach, describe, expect, it, vi } from "vitest";

import { fullscreenElement, needsTapInPlayer, turnForVideo, unlockOrientation } from "./fullscreen";

afterEach(() => vi.unstubAllGlobals());

describe("fullscreenElement", () => {
  it("prefers the standard element, falls back to Safari's, and is null otherwise", () => {
    const standard = {};
    const prefixed = {};
    vi.stubGlobal("document", { fullscreenElement: standard, webkitFullscreenElement: prefixed });
    expect(fullscreenElement()).toBe(standard);
    vi.stubGlobal("document", { fullscreenElement: null, webkitFullscreenElement: prefixed });
    expect(fullscreenElement()).toBe(prefixed);
    vi.stubGlobal("document", { fullscreenElement: null });
    expect(fullscreenElement()).toBeNull();
  });
});

describe("needsTapInPlayer", () => {
  const stub = (userAgent: string, platform = "", maxTouchPoints = 0) =>
    vi.stubGlobal("navigator", { userAgent, platform, maxTouchPoints });

  it("is true on iPhone, iPad and iPod", () => {
    for (const device of ["iPhone", "iPad", "iPod"]) {
      stub(`Mozilla/5.0 (${device}; CPU OS 18_0 like Mac OS X)`);
      expect(needsTapInPlayer()).toBe(true);
    }
  });

  it("is true on an iPad that reports itself as a Mac", () => {
    stub("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel", 5);
    expect(needsTapInPlayer()).toBe(true);
  });

  it("is false on a desktop Mac and on Android", () => {
    stub("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel", 0);
    expect(needsTapInPlayer()).toBe(false);
    stub("Mozilla/5.0 (Linux; Android 15)", "Linux armv8l", 5);
    expect(needsTapInPlayer()).toBe(false);
  });
});

describe("turnForVideo", () => {
  const sized = (width: number, height: number) => ({
    getVideoWidth: () => Promise.resolve(width),
    getVideoHeight: () => Promise.resolve(height),
  });

  it("locks to landscape for a wide video only", async () => {
    const lock = vi.fn(() => Promise.resolve());
    vi.stubGlobal("screen", { orientation: { lock } });
    await turnForVideo(sized(1920, 1080));
    expect(lock).toHaveBeenCalledWith("landscape");
    lock.mockClear();
    await turnForVideo(sized(1080, 1920));
    expect(lock).not.toHaveBeenCalled();
  });

  it("swallows a refused lock and a missing API", async () => {
    vi.stubGlobal("screen", { orientation: { lock: () => Promise.reject(new Error("NotSupportedError")) } });
    await expect(turnForVideo(sized(1920, 1080))).resolves.toBeUndefined();
    vi.stubGlobal("screen", { orientation: {} });
    await expect(turnForVideo(sized(1920, 1080))).resolves.toBeUndefined();
  });
});

describe("unlockOrientation", () => {
  it("unlocks when it can, and does nothing when the API is missing", () => {
    const unlock = vi.fn();
    vi.stubGlobal("screen", { orientation: { unlock } });
    unlockOrientation();
    expect(unlock).toHaveBeenCalledOnce();
    vi.stubGlobal("screen", { orientation: {} });
    expect(() => unlockOrientation()).not.toThrow();
    vi.stubGlobal("screen", {});
    expect(() => unlockOrientation()).not.toThrow();
  });
});
