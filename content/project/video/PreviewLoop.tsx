"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

import { VIMEO_FRAME_STYLE } from "./frame";
import { useVimeoPlayer } from "./useVimeoPlayer";

/**
 * The muted loop behind the title. Mounted only while its slide is on screen, so it fades in again each time.
 * It fades in once the player reports playback rather than on the iframe's load, which fires before the
 * first frame and would show black.
 */
export function PreviewLoop({ src, title }: { src: string; title: string }) {
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  useVimeoPlayer(frame, { play: () => setReady(true), bufferend: () => setReady(true) });
  return (
    // Decorative: aria-hidden and out of the tab order, so the title is never announced; it names the frame in dev tools.
    <iframe
      ref={setFrame}
      src={src}
      title={title}
      aria-hidden
      tabIndex={-1}
      loading="lazy"
      style={VIMEO_FRAME_STYLE}
      className={cn(
        "pointer-events-none absolute inset-0 size-full border-0 transition-opacity duration-700 motion-reduce:transition-none",
        ready ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
