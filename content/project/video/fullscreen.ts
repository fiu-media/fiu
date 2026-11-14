import type Player from "@vimeo/player";

// The DOM types say every browser has these, but iPhone Safari has no Fullscreen API and orientation locking is missing on
// desktop and iOS. So each is checked with `in` before it is called.

/** The fullscreen element, including Safari's prefixed API. */
export function fullscreenElement(): Element | null {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

/** Leaves full screen where the browser can; resolves either way. */
export async function exitFullscreen() {
  if ("exitFullscreen" in document) await document.exitFullscreen().catch(() => {});
}

/** Puts `element` full screen where the browser can; resolves either way. */
export async function requestFullscreen(element: Element) {
  if ("requestFullscreen" in element) await element.requestFullscreen().catch(() => {});
}

/** A wide video in a full-screen upright phone turns the screen sideways, so it fills it. Only works full screen, and not on iOS. */
export async function turnForVideo(player: Pick<Player, "getVideoWidth" | "getVideoHeight">) {
  try {
    const [width, height] = await Promise.all([player.getVideoWidth(), player.getVideoHeight()]);
    if (width > height && "orientation" in screen && "lock" in screen.orientation) await screen.orientation.lock("landscape");
  } catch {
    // Refused or unsupported: the viewer can still turn the phone themselves.
  }
}

/** Lets the screen turn freely again after `turnForVideo`. */
export function unlockOrientation() {
  if ("orientation" in screen && "unlock" in screen.orientation) screen.orientation.unlock();
}

/**
 * iOS (and every browser on it, which is all WebKit) only plays a video with sound after a tap inside the player's
 * own frame, so a tap on our Play button doesn't count and autoplay would start it muted.
 */
export function needsTapInPlayer() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
