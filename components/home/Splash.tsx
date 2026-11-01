"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import logo from "@/public/brand/fiu-logo.svg";
import { SPLASH_FADE_MS, splashFadeVars } from "./splash-config";

// The whole splash (backdrop and logo) fades as one, over SPLASH_FADE_MS (shared with the glass
// logo's fade-in in HomeHero and the shader reveal in LogoScene).
// will-change promotes the layer before the fade starts, so the first frame of it isn't a hitch.
const FADE_CLASSES =
  "will-change-[opacity] motion-safe:transition-opacity motion-safe:duration-(--splash-fade) motion-safe:ease-out";

// Once per page load: if the hero remounts (Suspense swap, client navigation back to `/`),
// the splash must not replay.
let dismissed = false;

export function isSplashDismissed() {
  return dismissed;
}

/**
 * Cover shown while the home hero loads. It is server-rendered, so it is on screen before any
 * JS runs, and holds the SVG logo at the exact size and centre the live logo starts its spin
 * from — fading out is the handoff.
 */
export function Splash({ done }: { done: boolean }) {
  const [gone, setGone] = useState(dismissed);

  useEffect(() => {
    if (!done) return;
    // Under reduced motion the fade is instant, so there is nothing to wait for.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => {
        dismissed = true;
        setGone(true);
      },
      reduced ? 0 : SPLASH_FADE_MS,
    );
    return () => window.clearTimeout(id);
  }, [done]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      style={splashFadeVars}
      className={cn("fixed inset-0 z-20 grid place-items-center", done && "pointer-events-none")}
    >
      {/* Backdrop and logo fade together. In live mode the glass logo fades in on top over the
          same SPLASH_FADE_MS (HomeHero), so the handoff happens inside this one fade. */}
      <div className={cn("absolute inset-0 bg-ink", FADE_CLASSES)} style={{ opacity: done ? 0 : 1 }} />
      <Image
        src={logo}
        alt=""
        priority
        sizes="(min-width: 768px) 42vw, 80vw"
        className={cn("relative h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none", FADE_CLASSES)}
        style={{ opacity: done ? 0 : 1 }}
      />
    </div>
  );
}
