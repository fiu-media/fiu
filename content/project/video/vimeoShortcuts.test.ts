import { describe, expect, it, vi } from "vitest";

import { runVimeoShortcut } from "./vimeoShortcuts";

function fakePlayer(state: { paused?: boolean; time?: number; volume?: number; muted?: boolean } = {}) {
  return {
    getPaused: vi.fn(async () => state.paused ?? false),
    play: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    getCurrentTime: vi.fn(async () => state.time ?? 10),
    setCurrentTime: vi.fn(async (seconds: number) => seconds),
    getVolume: vi.fn(async () => state.volume ?? 0.5),
    setVolume: vi.fn(async (volume: number) => volume),
    getMuted: vi.fn(async () => state.muted ?? false),
    setMuted: vi.fn(async (muted: boolean) => muted),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("runVimeoShortcut", () => {
  it.each([" ", "k"])("toggles playback on %j", async (key) => {
    const playing = fakePlayer({ paused: false });
    expect(runVimeoShortcut(key, playing, () => {})).toBe(true);
    await settle();
    expect(playing.pause).toHaveBeenCalled();

    const paused = fakePlayer({ paused: true });
    runVimeoShortcut(key, paused, () => {});
    await settle();
    expect(paused.play).toHaveBeenCalled();
  });

  it("seeks by five seconds and never before the start", async () => {
    const player = fakePlayer({ time: 3 });
    runVimeoShortcut("ArrowRight", player, () => {});
    await settle();
    expect(player.setCurrentTime).toHaveBeenLastCalledWith(8);
    runVimeoShortcut("ArrowLeft", player, () => {});
    await settle();
    expect(player.setCurrentTime).toHaveBeenLastCalledWith(0);
  });

  it("changes volume in steps clamped to 0-1", async () => {
    const loud = fakePlayer({ volume: 0.95 });
    runVimeoShortcut("ArrowUp", loud, () => {});
    await settle();
    expect(loud.setVolume).toHaveBeenLastCalledWith(1);

    const quiet = fakePlayer({ volume: 0.05 });
    runVimeoShortcut("ArrowDown", quiet, () => {});
    await settle();
    expect(quiet.setVolume).toHaveBeenLastCalledWith(0);
  });

  it("toggles mute", async () => {
    const player = fakePlayer({ muted: false });
    runVimeoShortcut("m", player, () => {});
    await settle();
    expect(player.setMuted).toHaveBeenCalledWith(true);
  });

  it("hands fullscreen to the caller", () => {
    const toggleFullscreen = vi.fn();
    expect(runVimeoShortcut("f", fakePlayer(), toggleFullscreen)).toBe(true);
    expect(toggleFullscreen).toHaveBeenCalledOnce();
  });

  it("leaves other keys alone", () => {
    const player = fakePlayer();
    expect(runVimeoShortcut("Escape", player, () => {})).toBe(false);
    expect(runVimeoShortcut("Tab", player, () => {})).toBe(false);
    expect(player.getPaused).not.toHaveBeenCalled();
  });

  it("swallows player errors", async () => {
    const player = fakePlayer();
    player.getPaused.mockRejectedValue(new Error("gone"));
    runVimeoShortcut(" ", player, () => {});
    await settle();
  });
});
