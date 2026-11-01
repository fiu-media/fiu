import type Player from "@vimeo/player";
import { type RefObject, useEffect, useRef } from "react";

type VimeoEvent = "play" | "bufferend" | "ended";

/**
 * Attaches the Vimeo Player SDK to an embed iframe and subscribes to the events in `handlers`.
 * The SDK is imported on demand, so slides without a video never download it. Returns a ref to the
 * player, which is null until the SDK has loaded and again once the iframe goes away.
 */
export function useVimeoPlayer(
  iframe: HTMLIFrameElement | null,
  handlers: Partial<Record<VimeoEvent, () => void>> & { ready?: (player: Player) => void },
): RefObject<Player | null> {
  const player = useRef<Player | null>(null);
  // Always call the latest handlers without re-attaching the player on every render.
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!iframe) return;
    let cancelled = false;
    let instance: Player | null = null;
    const listeners: [VimeoEvent, () => void][] = (["play", "bufferend", "ended"] as const).map((event) => [
      event,
      () => latest.current[event]?.(),
    ]);

    import("@vimeo/player").then(({ default: VimeoPlayer }) => {
      if (cancelled) return;
      instance = new VimeoPlayer(iframe);
      player.current = instance;
      for (const [event, listener] of listeners) instance.on(event, listener);
      latest.current.ready?.(instance);
    });

    return () => {
      cancelled = true;
      player.current = null;
      if (!instance) return;
      for (const [event, listener] of listeners) instance.off(event, listener);
      // destroy() also removes the iframe from the DOM, which React owns. Passive effect cleanups run
      // after the unmount, when the iframe is already detached and destroy() only drops the SDK's listeners.
      if (!iframe.isConnected) instance.destroy().catch(() => {});
    };
  }, [iframe]);

  return player;
}
