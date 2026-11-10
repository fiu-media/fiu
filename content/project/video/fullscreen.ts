import type Player from "@vimeo/player";

type LockableOrientation = ScreenOrientation & { lock?: (orientation: "landscape") => Promise<void> };

/** The fullscreen element, including Safari's prefixed API. */
export function fullscreenElement(): Element | null {
  return document.fullscreenElement ?? (document as { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ?? null;
}

/** A wide video in a full-screen upright phone turns the screen sideways, so it fills it. Only works full screen, and not on iOS. */
export async function turnForVideo(player: Pick<Player, "getVideoWidth" | "getVideoHeight">) {
  try {
    const [width, height] = await Promise.all([player.getVideoWidth(), player.getVideoHeight()]);
    if (width > height) await (screen.orientation as LockableOrientation).lock?.("landscape");
  } catch {
    // Refused or unsupported: the viewer can still turn the phone themselves.
  }
}

/** Lets the screen turn freely again after `turnForVideo`. */
export function unlockOrientation() {
  (screen.orientation as LockableOrientation | undefined)?.unlock?.();
}

/**
 * iOS (and every browser on it, which is all WebKit) only plays a video with sound after a tap inside the player's
 * own frame, so a tap on our Play button doesn't count and autoplay would start it muted.
 */
export function needsTapInPlayer() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
