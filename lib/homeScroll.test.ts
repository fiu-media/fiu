/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BLEED_PX, homeIsLocked, nudgeHomeScroll, nudgeHomeScrollRepeatedly, pinHomeScroll } from "./homeScroll";

describe("homeScroll", () => {
  let scrollY = 0;
  const scrollTo = vi.fn(({ top }: { top: number }) => {
    scrollY = top;
  });
  let rafQueue: FrameRequestCallback[] = [];

  beforeEach(() => {
    scrollY = BLEED_PX;
    rafQueue = [];
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    document.documentElement.setAttribute("data-home-lock", "");
    scrollTo.mockClear();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
  });

  afterEach(() => {
    // Drain any leftover frames so module nudge state can't leak into the next test.
    while (rafQueue.length) rafQueue.shift()!(0);
    document.documentElement.removeAttribute("data-home-lock");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function flushFrames() {
    while (rafQueue.length) rafQueue.shift()!(0);
  }

  it("reports the home lock from the html flag", () => {
    expect(homeIsLocked()).toBe(true);
    document.documentElement.removeAttribute("data-home-lock");
    expect(homeIsLocked()).toBe(false);
  });

  it("pins back to the bleed floor", () => {
    scrollY = 0;
    pinHomeScroll();
    expect(scrollTo).toHaveBeenCalledWith({ top: BLEED_PX, behavior: "instant" });
  });

  it("nudges once then restores, ignoring a concurrent nudge", () => {
    nudgeHomeScroll();
    nudgeHomeScroll();
    expect(scrollTo.mock.calls.map(([{ top }]) => top)).toEqual([BLEED_PX - 1]);
    flushFrames();
    expect(scrollTo.mock.calls.map(([{ top }]) => top)).toEqual([BLEED_PX - 1, BLEED_PX]);
  });

  it("does not pin while a nudge owns the scroll", () => {
    nudgeHomeScroll();
    scrollY = BLEED_PX - 1;
    pinHomeScroll();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    flushFrames();
  });

  it("does not nudge when scrolled into the fold", () => {
    scrollY = BLEED_PX + 40;
    nudgeHomeScroll();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("schedules the repeated menu-close nudges", () => {
    vi.useFakeTimers();
    nudgeHomeScrollRepeatedly();
    flushFrames();
    scrollTo.mockClear();
    vi.advanceTimersByTime(300);
    flushFrames();
    expect(scrollTo.mock.calls.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});
