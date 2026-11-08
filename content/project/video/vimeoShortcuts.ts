import type Player from "@vimeo/player";

const SEEK_SECONDS = 5;
const VOLUME_STEP = 0.1;

type ShortcutPlayer = Pick<
  Player,
  "getPaused" | "play" | "pause" | "getCurrentTime" | "setCurrentTime" | "getVolume" | "setVolume" | "getMuted" | "setMuted"
>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Vimeo's keyboard shortcuts only work while its cross-origin frame has focus, and Escape (stop) only works while
 * the page does. The page keeps focus, so this drives the player from the page's keys instead.
 * Returns whether `key` is a shortcut, so the caller can stop the browser acting on it too (Space would scroll).
 * Fullscreen is the caller's: it has to be requested on the iframe from the page, inside the key press itself,
 * which a round trip through the player's postMessage API would not preserve.
 */
export function runVimeoShortcut(key: string, player: ShortcutPlayer, toggleFullscreen: () => void): boolean {
  const run = (action: () => Promise<unknown>) => action().catch(() => {});

  switch (key) {
    case " ":
    case "k":
      run(async () => ((await player.getPaused()) ? player.play() : player.pause()));
      return true;
    case "ArrowLeft":
    case "ArrowRight": {
      const delta = key === "ArrowLeft" ? -SEEK_SECONDS : SEEK_SECONDS;
      run(async () => player.setCurrentTime(Math.max(0, (await player.getCurrentTime()) + delta)));
      return true;
    }
    case "ArrowUp":
    case "ArrowDown": {
      const delta = key === "ArrowUp" ? VOLUME_STEP : -VOLUME_STEP;
      run(async () => player.setVolume(clamp((await player.getVolume()) + delta, 0, 1)));
      return true;
    }
    case "m":
      run(async () => player.setMuted(!(await player.getMuted())));
      return true;
    case "f":
      toggleFullscreen();
      return true;
    default:
      return false;
  }
}
