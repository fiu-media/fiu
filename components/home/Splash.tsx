"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import logo from "@/public/brand/fiu-logo.svg";

// The whole splash (backdrop and logo) fades as one. Keep in sync with FADE_CLASSES below, the
// glass logo's fade-in in HomeHero, and the spin delay there.
const FADE_MS = 500;
const FADE_CLASSES = "motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-out";

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
export function Splash({ done, onGone }: { done: boolean; onGone?: () => void }) {
  const [gone, setGone] = useState(dismissed);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => {
      dismissed = true;
      setGone(true);
      onGone?.();
    }, FADE_MS);
    return () => window.clearTimeout(id);
  }, [done, onGone]);

  if (gone) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 grid place-items-center">
      {/* Backdrop and logo fade together. In live mode the glass logo fades in on top over the
          same 500 ms (HomeHero), so the handoff happens inside this one fade. */}
      <div className={`absolute inset-0 bg-ink ${FADE_CLASSES}`} style={{ opacity: done ? 0 : 1 }} />
      <Image
        src={logo}
        alt=""
        priority
        sizes="(min-width: 768px) 42vw, 80vw"
        className={`relative h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none ${FADE_CLASSES}`}
        style={{ opacity: done ? 0 : 1 }}
      />
    </div>
  );
}
