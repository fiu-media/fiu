"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import logo from "@/public/brand/fiu-logo.png";

// Backdrop fade-out: starts after a short delay, so the glass logo (which appears on top the
// moment `done` flips) has the splash to itself for a beat. Keep in sync with the classes below.
const FADE_MS = 1300;

// Once per page load: if the hero remounts (Suspense swap, client navigation back to `/`),
// the splash must not replay.
let dismissed = false;

export function isSplashDismissed() {
  return dismissed;
}

/**
 * Cover shown while the home hero loads. It is server-rendered, so it is on screen before any
 * JS runs, and holds the PNG logo at the exact size and centre the live logo starts its spin
 * from — fading out is the handoff.
 */
export function Splash({
  done,
  swapLogo,
  onGone,
}: {
  done: boolean;
  /** The glass logo will take over on top: fade the PNG logo out on its own, before the spin starts. */
  swapLogo: boolean;
  onGone?: () => void;
}) {
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
      {/* The backdrop fades slowly. In live mode the glass logo cross-fades in over the PNG logo
          (HomeHero, 700 ms), and the PNG fades out alongside it, same 700 ms, before the spin starts. */}
      <div
        className="absolute inset-0 bg-ink motion-safe:transition-opacity motion-safe:delay-300 motion-safe:duration-1000 motion-safe:ease-in-out"
        style={{ opacity: done ? 0 : 1 }}
      />
      <Image
        src={logo}
        alt=""
        priority
        sizes="(min-width: 768px) 42vw, 80vw"
        className={`relative h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none ${
          swapLogo ? "motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-out" : "motion-safe:transition-opacity motion-safe:delay-300 motion-safe:duration-1000 motion-safe:ease-in-out"
        }`}
        style={{ opacity: done ? 0 : 1 }}
      />
    </div>
  );
}
