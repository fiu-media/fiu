import { describe, expect, it, vi } from "vitest";

import {
  initialIntro,
  type IntroEvent,
  introReducer,
  type IntroState,
  selectIntroDone,
  selectLogoAtLeft,
  selectMode,
  selectSceneTier,
  selectSnapToLeft,
  selectSpinGo,
  selectSplashDone,
  type Support,
} from "./intro";

const run = (events: IntroEvent[], from: IntroState = initialIntro()) => events.reduce(introReducer, from);

describe("fast load", () => {
  const live: Support = "high";

  it("holds the splash until the scene is ready and the minimum has passed", () => {
    let state = initialIntro();
    expect(selectSplashDone(state, live)).toBe(false);
    state = run([{ type: "minElapsed" }], state);
    expect(selectSplashDone(state, live)).toBe(false);
    state = run([{ type: "sceneReady" }], state);
    expect(selectSplashDone(state, live)).toBe(true);
  });

  it("does not lift before the minimum even when the scene is ready", () => {
    expect(selectSplashDone(run([{ type: "sceneReady" }]), live)).toBe(false);
  });

  it("goes splash, spin, settled, and the logo stays glass", () => {
    let state = run([{ type: "minElapsed" }, { type: "sceneReady" }]);
    expect(selectSpinGo(state)).toBe(false);
    state = run([{ type: "spinDue" }], state);
    expect(state.stage).toBe("spin");
    expect(selectSpinGo(state)).toBe(true);
    expect(selectIntroDone(state)).toBe(false);
    state = run([{ type: "settled" }], state);
    expect(selectIntroDone(state)).toBe(true);
    expect(selectMode(state, live)).toBe("live");
    expect(selectLogoAtLeft(state, live)).toBe(false);
  });

  it("never moves the stage backwards when the scene settles before the spin timer", () => {
    expect(run([{ type: "settled" }, { type: "spinDue" }]).stage).toBe("settled");
  });
});

describe("slow scene and timeout", () => {
  it("keeps the splash while the scene is not ready", () => {
    expect(selectSplashDone(run([{ type: "minElapsed" }]), "medium")).toBe(false);
  });

  it("lifts at the timeout without a ready scene", () => {
    expect(selectSplashDone(run([{ type: "timedOut" }]), "medium")).toBe(true);
  });
});

describe("reduced motion and static mode", () => {
  it("has no scene, and lifts once the minimum has passed", () => {
    const state = initialIntro();
    expect(selectMode(state, "static")).toBe("static");
    expect(selectSceneTier(state, "static")).toBeNull();
    expect(selectSplashDone(state, "static")).toBe(false);
    expect(selectSplashDone(run([{ type: "minElapsed" }]), "static")).toBe(true);
  });

  it("glides the SVG logo left once the splash lifts", () => {
    const state = initialIntro();
    expect(selectLogoAtLeft(state, "static")).toBe(false);
    expect(selectLogoAtLeft(run([{ type: "minElapsed" }]), "static")).toBe(true);
  });

  it("does not decide anything before the device is known", () => {
    const state = run([{ type: "minElapsed" }]);
    expect(selectMode(state, "pending")).toBe("pending");
    expect(selectSceneTier(state, "pending")).toBeNull();
    expect(selectSplashDone(state, "pending")).toBe(false);
  });
});

describe("too slow", () => {
  it("mid-intro: fades the scene out over the SVG, which then glides rather than snaps", () => {
    const state = run([{ type: "minElapsed" }, { type: "sceneReady" }, { type: "spinDue" }, { type: "tooSlow", tier: "low" }]);
    expect(state.slow).toEqual({ fading: true, settled: false, tier: "low" });
    expect(selectMode(state, "low")).toBe("static");
    // The scene stays mounted at its own tier while it fades, even though the device's decision is now static.
    expect(selectSceneTier(state, "static")).toBe("low");
    expect(selectSnapToLeft(state)).toBe(false);
  });

  it("after the intro: the SVG takes over already at the left", () => {
    const state = run([{ type: "settled" }, { type: "tooSlow", tier: "low" }]);
    expect(state.slow?.settled).toBe(true);
    expect(selectSnapToLeft(state)).toBe(true);
  });

  it("unmounts the scene once the fade is done", () => {
    const state = run([{ type: "tooSlow", tier: "medium" }, { type: "slowFadeDone" }]);
    expect(state.slow).toEqual({ fading: false, settled: false, tier: "medium" });
    expect(selectSceneTier(state, "static")).toBeNull();
    expect(selectMode(state, "static")).toBe("static");
  });

  it("ignores a fade end when nothing was slow", () => {
    const state = initialIntro();
    expect(introReducer(state, { type: "slowFadeDone" })).toBe(state);
  });
});

describe("scene failure (context lost, model or texture error)", () => {
  it("drops to the SVG and unmounts the scene", () => {
    const state = run([{ type: "sceneFailed" }]);
    expect(selectMode(state, "high")).toBe("static");
    expect(selectSceneTier(state, "high")).toBeNull();
  });

  it("no longer waits for a scene that will not report ready", () => {
    const state = run([{ type: "sceneFailed" }, { type: "minElapsed" }]);
    expect(selectSplashDone(state, "high")).toBe(true);
  });
});

describe("resuming after a language switch", () => {
  // The flags are module state, so each test loads fresh copies of the modules: a new page load.
  it("starts a fresh page load at the splash", async () => {
    vi.resetModules();
    const { initialIntro } = await import("./intro");
    const state = initialIntro();
    expect(state).toMatchObject({ stage: "splash", minElapsed: false, timedOut: false, resumed: false });
  });

  it("comes back settled, with the splash skipped and the SVG at rest", async () => {
    vi.resetModules();
    const session = await import("./session");
    const { initialIntro } = await import("./intro");
    session.markSplashDismissed();
    session.markIntroPlayed();
    const state = initialIntro();
    expect(state).toMatchObject({ stage: "settled", minElapsed: true, timedOut: true, resumed: true });
    expect(selectSplashDone(state, "high")).toBe(true);
    expect(selectIntroDone(state)).toBe(true);
    expect(selectLogoAtLeft(state, "high")).toBe(true);
    expect(selectSnapToLeft(state)).toBe(true);
  });
});

describe("session", () => {
  it("starts unset and sticks once marked", async () => {
    vi.resetModules();
    const fresh = await import("./session");
    expect(fresh.hasIntroPlayed()).toBe(false);
    expect(fresh.isSplashDismissed()).toBe(false);
    fresh.markIntroPlayed();
    fresh.markSplashDismissed();
    expect(fresh.hasIntroPlayed()).toBe(true);
    expect(fresh.isSplashDismissed()).toBe(true);
  });

  it("remembers the still on show", async () => {
    vi.resetModules();
    const fresh = await import("./session");
    expect(fresh.getStill()).toBeNull();
    fresh.setStill("/b.jpg");
    expect(fresh.getStill()).toBe("/b.jpg");
  });
});
