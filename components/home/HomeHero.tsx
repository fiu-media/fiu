"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import logo from "@/public/brand/fiu-logo.svg";
import type { HeroStill } from "@/sanity/lib/stills";
import { isSplashDismissed, Splash } from "./Splash";
import { SPLASH_FADE_MS, splashFadeVars } from "./splash-config";

const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });

const ROTATE_SECONDS = 6;
/** Keep the splash up at least this long so a fast load doesn't flash it. */
const SPLASH_MIN_MS = 800;
/** Never hold the splash longer than this, even if the live scene never reports ready. */
const SPLASH_MAX_MS = 4000;
/**
 * The splash fades as one (backdrop + SVG logo) over SPLASH_FADE_MS while the glass logo fades in
 * on top over the same time. The spin starts partway through that fade, so the two read as one
 * gesture. It can't start at 0: the spin front-loads its speed, and the glass would visibly turn
 * away from the SVG it is cross-fading with.
 */
const SPIN_DELAY_MS = SPLASH_FADE_MS * 0.35;
/**
 * Static mode has no scene to report the end of the intro, so the stills start rotating this long
 * after the splash lifts (the logo's 300 ms delay + 1 s slide, plus margin).
 */
const INTRO_SETTLE_MS = 2000;
/**
 * Live mode: the scene reports the end of its intro (`onIntroEnd`), which on a slow device runs
 * well past INTRO_SETTLE_MS, since its clock is frame-capped. Swapping the layout/stacking or
 * starting still rotation mid-spin costs a layer re-composite and extra WebGL work on the frames
 * that matter most. This is only a backstop for a scene that stops drawing.
 */
const INTRO_BACKSTOP_MS = 12000;

/** Mobile only: matches the padding around Home's <main> and HomeScrollLock's BLEED_PX. Symmetric, so the logo stays centred. */
const BLEED_CLASS = "max-md:-inset-y-48";

type Mode = "pending" | "live" | "static";

let liveSupport: boolean | undefined;
function canRenderLive() {
  if (liveSupport === undefined) {
    try {
      liveSupport = Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch {
      liveSupport = false;
    }
  }
  return liveSupport && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** "pending" on the server and during hydration, then live/static once known on the client. */
function useLiveSupport(): Mode {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => (canRenderLive() ? "live" : "static"),
    () => "pending",
  );
}

/**
 * Home hero (Canva mockup 1): rotating full-bleed stills with the glass logo.
 *
 * Mesh / rim playground controls live at `/dev/logo-playground`.
 */
export function HomeHero({ stills }: { stills: HeroStill[] }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const support = useLiveSupport();
  const mode: Mode = failed ? "static" : support;

  const [minElapsed, setMinElapsed] = useState(isSplashDismissed);
  const [timedOut, setTimedOut] = useState(isSplashDismissed);
  const [spinGo, setSpinGo] = useState(isSplashDismissed);
  const [introDone, setIntroDone] = useState(isSplashDismissed);
  const splashDone = timedOut || (minElapsed && (mode === "live" ? sceneReady : mode === "static"));
  // The static SVG logo starts centred under the splash, then glides left on desktop.
  const logoAtLeft = mode === "static" && splashDone;

  useEffect(() => {
    const min = window.setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS);
    const max = window.setTimeout(() => setTimedOut(true), SPLASH_MAX_MS);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    const spin = window.setTimeout(() => setSpinGo(true), SPIN_DELAY_MS);
    return () => window.clearTimeout(spin);
  }, [splashDone]);

  useEffect(() => {
    if (!splashDone) return;
    const settled = window.setTimeout(
      () => setIntroDone(true),
      mode === "live" ? INTRO_BACKSTOP_MS : INTRO_SETTLE_MS,
    );
    return () => window.clearTimeout(settled);
  }, [splashDone, mode]);

  // Held until the intro is over so a still crossfade (and its extra rendering) never lands
  // mid-spin.
  useEffect(() => {
    if (!introDone) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % stills.length), ROTATE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [introDone, stills.length]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onIntroEnd = useCallback(() => setIntroDone(true), []);
  const onFail = useCallback(() => setFailed(true), []);
  const sceneStills = useMemo(
    () =>
      stills.map(({ src, width, height, lightTint }) => ({
        src,
        width,
        height,
        lightTint,
      })),
    [stills],
  );

  return (
    <>
      {/* Outside the -z-10 hero so it stacks above the nav as well. */}
      <Splash done={splashDone} />
      {/* On mobile the photo is 12rem taller than the page above and below (BLEED_CLASS): real pixels for Safari to show behind
          its status bar and toolbar. Not fixed, or Safari would tint its bars from this layer instead. */}
      <div className={`absolute inset-0 -z-10 ${BLEED_CLASS}`}>
        {stills.map((still, i) => (
          <Image
            key={still.src}
            src={still.src}
            alt={still.alt}
            fill
            priority={i === 0}
            placeholder={still.blurDataURL ? "blur" : "empty"}
            blurDataURL={still.blurDataURL}
            quality={90}
            sizes="100vw"
            className="object-cover transition-opacity duration-[1600ms] ease-in-out"
            style={{ opacity: i === index ? 1 : 0, objectPosition: still.position }}
            data-sanity={still.dataSanity}
          />
        ))}

        {/* SVG logo: shown on the server render, while the live scene loads, and as the
            fallback. The live logo starts its spin from this same centred, front-facing pose,
            then glides to the left on desktop, to a 42vw logo that starts 2vw clear of the side rail
            (-27vw + 4rem = from 50vw to rail + 2vw + half of 42vw). */}
        <div
          className={`pointer-events-none absolute inset-0 grid place-items-center ${splashDone && mode !== "live" ? "motion-safe:transition-opacity motion-safe:duration-700" : ""}`}
          style={{ opacity: mode === "live" && sceneReady ? 0 : 1 }}
        >
          <Image
            src={logo}
            alt=""
            priority
            sizes="(min-width: 768px) 42vw, 80vw"
            className={`h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none motion-safe:transition-transform motion-safe:delay-300 motion-safe:duration-1000 motion-safe:ease-in-out ${
              logoAtLeft ? "md:-translate-x-[calc(27vw-4rem-env(safe-area-inset-left))]" : "md:translate-x-0"
            }`}
          />
        </div>
      </div>

      {mode === "live" && (
        <SceneBoundary onError={onFail}>
          {/* Never `fixed`: WebKit tints its bars from a viewport-sized fixed layer over a canvas, which hides the photo behind them. Lifted above the splash while it fades, then dropped back under the nav once the intro has settled. Hidden until the
              fade starts, then cross-faded in over the SVG logo, which fades out underneath. */}
          <div
            aria-hidden
            className={`absolute inset-0 ${BLEED_CLASS} ${
              introDone ? "-z-10" : "pointer-events-none z-30 transition-opacity duration-(--splash-fade) ease-out will-change-[opacity]"
            }`}
            style={{ ...splashFadeVars, opacity: sceneReady && splashDone ? 1 : 0 }}
          >
            <LogoScene
              stills={sceneStills}
              index={index}
              onReady={onReady}
              meshMode="extrude"
              rimLook="light"
              introSlide
              introHold={!spinGo}
              splashLift={splashDone}
              interactive={introDone}
              onIntroEnd={onIntroEnd}
              onContextLost={onFail}
            />
          </div>
        </SceneBoundary>
      )}
    </>
  );
}

/** If the 3D scene throws (model or texture failed, context lost), fall back to the SVG logo. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // The SVG fallback hides the failure visually, so leave a trace for debugging.
    console.error("[HomeHero] live logo failed, showing SVG fallback:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
