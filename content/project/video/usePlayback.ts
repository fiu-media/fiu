import type Player from "@vimeo/player";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { matches } from "@/lib/hooks/useMediaQuery";
import { UPRIGHT_TOUCH } from "@/lib/media";
import type { VimeoRef } from "@/lib/vimeo";

import { fullscreenElement, needsTapInPlayer, turnForVideo, unlockOrientation } from "./fullscreen";
import { useVimeoPlayer } from "./useVimeoPlayer";
import { runVimeoShortcut } from "./vimeoShortcuts";

/** Mostly on screen: the preview loop runs. Mostly off: a playing video pauses. */
const ACTIVE_RATIO = 0.6;
const LEFT_RATIO = 0.25;
/** If the player never reports playback (autoplay blocked), show it anyway so its own play button is reachable. */
const REVEAL_FALLBACK_MS = 3000;
/** Escape that ends fullscreen can reach the page as well; it shouldn't also stop the video. */
const FULLSCREEN_EXIT_GRACE_MS = 500;
/** How long after leaving fullscreen the window may still be animating back to size. */
const FULLSCREEN_SETTLE_MS = 1000;
/** How long a browser gets to pause a video it won't let play with sound, before we conclude it hasn't. */
const UNMUTE_SETTLE_MS = 400;

/**
 * Vimeo starts an autoplaying video muted on many phones, and the viewer tapped Play, so they want sound. But a
 * browser that only allows sound after a tap inside the player answers an unmute by pausing the video, and a paused
 * video is worse than a muted one: in that case keep it muted and playing, and the player's own controls unmute it.
 */
async function unmute(player: Player) {
  try {
    if (!(await player.getMuted())) return;
    await player.setMuted(false);
    await new Promise((resolve) => setTimeout(resolve, UNMUTE_SETTLE_MS));
    if (await player.getPaused()) {
      await player.setMuted(true);
      await player.play();
    }
  } catch {
    // The player went away, or refused: leave it as it is.
  }
}

/**
 * Everything about playing a project's video inside its slide: the play/stop state, the Vimeo player, fullscreen
 * and orientation, the unmute heuristic, pausing when the slide scrolls away, and the keyboard shortcuts.
 * `rootRef` is the slide's own element: it is what goes full screen and what keeps keyboard focus.
 */
export function usePlayback(rootRef: RefObject<HTMLElement | null>, { video }: { video: VimeoRef | null }) {
  const [playerFrame, setPlayerFrame] = useState<HTMLIFrameElement | null>(null);
  const away = useRef(false);
  const [onScreen, setOnScreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  // The player stays invisible over the cover until it is actually playing, so its loading screen never shows.
  const [revealed, setRevealed] = useState(false);
  // Whether the slide itself (not just the Vimeo frame) is full screen. Its Stop button then needs no room for the menu.
  // Unmuting is tried once per play: pausing and resuming the video after a refusal would otherwise start it over.
  const triedUnmute = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  // iPhones can't take an element full screen; their player goes full screen itself when asked not to play inline.
  const [playFullscreenNatively, setPlayFullscreenNatively] = useState(false);
  // Where sound needs a tap in the player, it doesn't autoplay: its own play button is shown, and that tap plays with sound.
  const [tapInPlayer, setTapInPlayer] = useState(false);

  const play = useCallback(() => {
    if (!video) return;
    setPlaying(true);
    setTapInPlayer(needsTapInPlayer());
    triedUnmute.current = false;
    if (!matches(UPRIGHT_TOUCH)) return;
    // Held upright, a wide video fills a third of the screen. Full screen, turned sideways, it fills all of it.
    // This has to happen in the tap's own handler, before the player exists, so it is the slide that goes full screen.
    const slide = rootRef.current;
    if (slide?.requestFullscreen) void slide.requestFullscreen().catch(() => {});
    else setPlayFullscreenNatively(true);
  }, [video, rootRef]);
  const reveal = useCallback(() => setRevealed(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setRevealed(false);
    setPlayFullscreenNatively(false);
    setTapInPlayer(false);
    // iPhone Safari has no Fullscreen API, though the DOM types say it does.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (fullscreenElement() === rootRef.current) void document.exitFullscreen?.().catch(() => {});
    unlockOrientation();
    // The player is gone; put keyboard focus back where it came from.
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>("[data-play]")?.focus());
  }, [rootRef]);

  // A playing video pauses when its slide scrolls away, keeping its place, and stays mounted.
  const player = useVimeoPlayer(playerFrame, {
    // Not `play`: Vimeo fires that before the first frame, while its own spinner is still up.
    playing: () => {
      reveal();
      // After playback has started: unmuting a video that hasn't begun would stop its autoplay.
      if (player.current && !triedUnmute.current) {
        triedUnmute.current = true;
        void unmute(player.current);
      }
    },
    ended: stop,
    // The SDK can load after the viewer has already left the slide.
    ready: (ready) => {
      if (away.current) ready.pause().catch(() => {});
      // Nothing is about to autoplay, so there is no loading screen to hide: show the player's play button.
      if (tapInPlayer) void ready.ready().then(reveal, () => {});
      if (fullscreenElement() === rootRef.current) void turnForVideo(ready);
    },
  });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setOnScreen(entry.intersectionRatio >= ACTIVE_RATIO);
        away.current = entry.intersectionRatio < LEFT_RATIO;
        // The page can shift under a fullscreen video (see below); that isn't the viewer scrolling away.
        if (away.current && !fullscreenElement()) player.current?.pause().catch(() => {});
      },
      { threshold: [0, LEFT_RATIO, ACTIVE_RATIO] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [player, rootRef]);

  // Focus goes to the slide, not into the player: key presses inside Vimeo's cross-origin frame never reach the
  // page, so Escape couldn't stop the video. The page handles Vimeo's shortcuts itself instead (see `onKeyDown`).
  // Not to Stop either: a focused button would swallow Space. Tab goes to Stop, then on into the player's controls.
  useEffect(() => {
    if (playing) rootRef.current?.focus({ preventScroll: true });
  }, [playing, rootRef]);

  useEffect(() => {
    if (!playing || !playerFrame) return;
    const slide = rootRef.current?.closest("section");
    let fullscreen = false;
    let exitedAt = -Infinity;
    let settling: ReturnType<typeof setTimeout> | undefined;
    // Going fullscreen resizes the window, and the document's mandatory snapping can land on another slide (or the
    // top of the page) as it resizes back. Put this slide back, and keep doing so until the window has settled.
    const restore = () => slide?.scrollIntoView({ block: "start", behavior: "instant" });
    const stopRestoring = () => window.removeEventListener("resize", restore);

    const onFullscreenChange = () => {
      const element = fullscreenElement();
      setFullscreen(element === rootRef.current);
      if (element === playerFrame || element === rootRef.current) {
        fullscreen = true;
        // The player may have loaded before the slide finished going full screen.
        if (element === rootRef.current && player.current) void turnForVideo(player.current);
        return;
      }
      if (!fullscreen) return;
      fullscreen = false;
      unlockOrientation();
      exitedAt = performance.now();
      restore();
      window.addEventListener("resize", restore);
      clearTimeout(settling);
      settling = setTimeout(stopRestoring, FULLSCREEN_SETTLE_MS);
      // Focus was inside the player; bring it back out so Escape works again.
      rootRef.current?.focus({ preventScroll: true });
    };

    const toggleFullscreen = () => {
      // iPhone Safari has no Fullscreen API, though the DOM types say it does.
      /* eslint-disable @typescript-eslint/no-unnecessary-condition */
      if (fullscreenElement()) void document.exitFullscreen?.().catch(() => {});
      else void playerFrame.requestFullscreen?.().catch(() => {});
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || away.current) return;
      if (event.key === "Escape") {
        if (fullscreenElement() || performance.now() - exitedAt < FULLSCREEN_EXIT_GRACE_MS) return;
        stop();
        return;
      }
      // Space and Enter belong to a focused button (Stop), and typing belongs to fields.
      const target = event.target instanceof Element ? event.target : null;
      if (event.altKey || event.ctrlKey || event.metaKey || target?.closest("button, a, input, textarea, select")) return;
      const current = player.current;
      if (current && runVimeoShortcut(event.key, current, toggleFullscreen)) event.preventDefault();
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(settling);
      stopRestoring();
    };
  }, [playing, playerFrame, player, stop, rootRef]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(reveal, REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [playing, reveal]);

  return {
    playing,
    revealed,
    fullscreen,
    tapInPlayer,
    playFullscreenNatively,
    play,
    stop,
    setPlayerFrame,
    playerFrame,
    onScreen,
  };
}
