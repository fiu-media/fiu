"use client";

import dynamic from "next/dynamic";
import Image, { getImageProps } from "next/image";
import {
  Component,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { decideLogoTier, type LogoDecision, type LogoTier, rememberTooSlow } from "@/features/logo";
import { cn } from "@/lib/cn";
import { usePortrait } from "@/lib/hooks/usePortrait";
import { prefersReducedMotion, subscribeToReducedMotion } from "@/lib/hooks/useReducedMotion";
import { PORTRAIT } from "@/lib/media";
import logo from "@/public/brand/fiu-logo.svg";
import type { HeroStill, HeroStills } from "@/sanity/lib/stills";

import { SPLASH_FADE_MS, splashFadeVars } from "../splash-config";
import { HeroFade } from "./HeroFade";
import { isSplashDismissed, Splash } from "./Splash";

const LogoScene = dynamic(() => import("@/features/logo/LogoScene"), { ssr: false });

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
/** A scene that turns out too slow fades out over the SVG's own fade-in (`duration-700` below), then unmounts. */
const SLOW_FADE_MS = 700;
/**
 * The hidden canvas is never fully transparent: at 0 the browser stops compositing it, and then
 * the scene's quality probe (which runs while it is hidden) misses that cost and reads a slow
 * device as fast. At this it is still invisible.
 */
const HIDDEN_SCENE_OPACITY = 0.001;

/**
 * Once per page load, like the splash: the intro has played out. The page tree is mounted again when the language is
 * switched, and the logo must come back at rest then, not spin in from the middle again.
 */
let introPlayed = false;

type Mode = "pending" | "live" | "static";
/** splash up, then the logo spinning, then settled (stills rotate, scene interactive). */
type Stage = "splash" | "spin" | "settled";

/**
 * "pending" on the server and during hydration, then the glass logo's starting tier, or "static"
 * (the SVG) for reduced motion and devices below the floor. See `logoTier.ts`.
 */
function useLiveSupport(): "pending" | LogoDecision {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => (prefersReducedMotion() ? "static" : decideLogoTier()),
    () => "pending",
  );
}

/**
 * Home hero (Canva mockup 1): rotating full-bleed stills with the glass logo.
 *
 * Mesh / rim playground controls live at `/dev/logo-playground`.
 */
export function HomeHero({ landscape, portrait }: HeroStills) {
  const [index, setIndex] = useState(0);
  const portraitScreen = usePortrait();
  const slides = useMemo(() => toSlides(landscape, portrait), [landscape, portrait]);
  const current = index % slides.length;
  const [failed, setFailed] = useState(false);
  /**
   * The scene ran but was too slow: it fades out over the SVG (`fading`), then unmounts. Keeps the
   * scene's tier, since the device's own decision turns to "static" at once.
   */
  const [slow, setSlow] = useState<{ fading: boolean; settled: boolean; tier: LogoTier } | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const support = useLiveSupport();
  const tier: LogoTier | null = support === "pending" || support === "static" ? null : support;
  const mode: Mode = failed || slow ? "static" : support === "pending" ? "pending" : tier ? "live" : "static";
  const sceneTier = failed ? null : slow ? (slow.fading ? slow.tier : null) : tier;

  // The intro is one schedule: the splash lifts, the glass logo starts to spin partway through the fade, and the
  // intro settles. Held in "splash" until the gates below open, and skipped when the splash was already dismissed.
  const [minElapsed, setMinElapsed] = useState(isSplashDismissed);
  const [timedOut, setTimedOut] = useState(isSplashDismissed);
  const [stage, setStage] = useState<Stage>(isSplashDismissed() ? "settled" : "splash");
  // A hero mounted after the intro already played shows the SVG at rest (left) until the glass logo takes over in place.
  const [resumed] = useState(() => introPlayed);
  const splashDone = timedOut || (minElapsed && (mode === "live" ? sceneReady : mode === "static"));
  const spinGo = stage !== "splash";
  const introDone = stage === "settled";
  // The static SVG logo starts centred under the splash, then glides left on desktop. Taking over from a
  // settled glass logo, it is already there.
  const logoAtLeft = (mode === "static" || resumed) && splashDone;
  const snapToLeft = Boolean(slow?.settled) || resumed;

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS),
      window.setTimeout(() => setTimedOut(true), SPLASH_MAX_MS),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    // A scene that ends its intro first settles the stage itself (onIntroEnd), so these never move it backwards.
    const timers = [
      window.setTimeout(() => setStage((s) => (s === "splash" ? "spin" : s)), SPIN_DELAY_MS),
      window.setTimeout(() => setStage("settled"), mode === "live" ? INTRO_BACKSTOP_MS : INTRO_SETTLE_MS),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [splashDone, mode]);

  // Held until the intro is over so a still crossfade (and its extra rendering) never lands
  // mid-spin.
  useEffect(() => {
    if (introDone) introPlayed = true;
  }, [introDone]);

  useEffect(() => {
    if (!introDone) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [introDone, slides.length]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onIntroEnd = useCallback(() => setStage("settled"), []);
  const onFail = useCallback(() => setFailed(true), []);
  const onTooSlow = useCallback(() => {
    if (!tier) return;
    rememberTooSlow();
    setSlow({ fading: true, settled: introDone, tier });
  }, [introDone, tier]);

  useEffect(() => {
    if (!slow?.fading) return;
    const id = window.setTimeout(() => setSlow((s) => s && { ...s, fading: false }), SLOW_FADE_MS);
    return () => window.clearTimeout(id);
  }, [slow?.fading]);
  // The scene is client-only, so it can read the orientation up front and draw the set the screen shows.
  const sceneStills = useMemo(
    () =>
      slides.map(({ landscape, portrait }) => {
        const { src, width, height, lightTint } = portraitScreen ? portrait : landscape;
        return { src, width, height, lightTint };
      }),
    [slides, portraitScreen],
  );

  return (
    <>
      {/* Outside the -z-10 hero so it stacks above the nav as well. */}
      <Splash done={splashDone} />
      {/* On mobile the photo is 12rem taller than the page above and below (BLEED_CLASS): real pixels for Safari to show behind
          its status bar and toolbar. Not fixed, or Safari would tint its bars from this layer instead. */}
      <div className={cn("absolute inset-0 -z-10", BLEED_CLASS)}>
        {slides.map((slide, i) => (
          <Slide key={i} {...slide} portraitScreen={portraitScreen} shown={i === current} priority={i === 0} />
        ))}
        {/* The photo dissolves into the page's ink where the fold begins, under the logo layers that follow. */}
        <HeroFade bleed />

        {/* SVG logo: shown on the server render, while the live scene loads, and as the
            fallback. The live logo starts its spin from this same centred, front-facing pose,
            then glides to the left on desktop, to a 42vw logo that starts 2vw clear of the side rail
            (-27vw + 4rem = from 50vw to rail + 2vw + half of 42vw). */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 grid place-items-center",
            splashDone && (mode !== "live" || resumed) && "motion-safe:transition-opacity motion-safe:duration-700",
          )}
          style={{ opacity: mode === "live" && sceneReady ? 0 : 1 }}
        >
          <Image
            src={logo}
            alt=""
            priority
            sizes="(min-width: 768px) 42vw, 80vw"
            className={cn(
              "h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none",
              !snapToLeft
                && "motion-safe:transition-transform motion-safe:delay-300 motion-safe:duration-1000 motion-safe:ease-in-out",
              logoAtLeft ? "md:-translate-x-[calc(27vw-4rem-env(safe-area-inset-left))]" : "md:translate-x-0",
            )}
          />
        </div>
      </div>

      {sceneTier && (
        <SceneBoundary onError={onFail}>
          {/* Never `fixed`: WebKit tints its bars from a viewport-sized fixed layer over a canvas, which hides the photo behind them. Lifted above the splash while it fades, then dropped back under the nav once the intro has settled. Hidden until the
              fade starts, then cross-faded in over the SVG logo, which fades out underneath. */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0",
              BLEED_CLASS,
              introDone
                ? cn("-z-10", resumed && "motion-safe:transition-opacity motion-safe:duration-700")
                : "pointer-events-none z-30 transition-opacity duration-(--splash-fade) ease-out will-change-[opacity]",
              slow && "pointer-events-none transition-opacity duration-700",
            )}
            style={{ ...splashFadeVars, opacity: sceneReady && splashDone && !slow ? 1 : HIDDEN_SCENE_OPACITY }}
          >
            <LogoScene
              // Another orientation is another set of textures; the scene only reads its first one once.
              key={portraitScreen ? "portrait" : "landscape"}
              stills={sceneStills}
              index={current}
              onReady={onReady}
              meshMode="extrude"
              rimLook="light"
              introSlide
              introHold={!spinGo}
              introPlayed={resumed}
              // Resumed: no splash to lift, so the photo is in the glass from the first frame.
              splashLift={resumed ? undefined : splashDone}
              interactive={introDone}
              onIntroEnd={onIntroEnd}
              onContextLost={onFail}
              tier={sceneTier}
              onTooSlow={onTooSlow}
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

type SlidePair = { landscape: HeroStill; portrait: HeroStill };

/**
 * One slide per position, each pairing a landscape still with a portrait one. The two sets can differ in length
 * (a project's mobile gallery is picked separately), so the shorter one repeats; either one alone fills the other.
 */
function toSlides(landscape: HeroStill[], portrait: HeroStill[]): SlidePair[] {
  const wide = landscape.length > 0 ? landscape : portrait;
  const tall = portrait.length > 0 ? portrait : landscape;
  return Array.from({ length: Math.max(wide.length, tall.length) }, (_, i) => ({
    landscape: wide[i % wide.length]!,
    portrait: tall[i % tall.length]!,
  }));
}

/**
 * One slide of the hero. A `<picture>` lets the browser fetch only the still that fits the screen's orientation
 * (same as a project's cover); the hotspot and blur placeholder follow it through CSS variables, and the alt text
 * and Presentation link follow it once the client knows the orientation (the server assumes landscape).
 */
function Slide({
  landscape,
  portrait,
  portraitScreen,
  shown,
  priority,
}: SlidePair & { portraitScreen: boolean; shown: boolean; priority: boolean }) {
  // Not `preload`: a preload link can't say which of the two sources the screen will pick.
  const eager = priority ? ({ loading: "eager", fetchPriority: "high" } as const) : {};
  const props = (still: HeroStill) =>
    getImageProps({ src: still.src, alt: still.alt, fill: true, quality: 90, sizes: "100vw", ...eager }).props;
  const wide = props(landscape);
  const tall = props(portrait);
  const blur = (still: HeroStill) => (still.blurDataURL ? `url("${still.blurDataURL}")` : "none");
  const vars = {
    "--still-position": landscape.position ?? "50% 50%",
    "--still-position-portrait": portrait.position ?? "50% 50%",
    "--still-blur": blur(landscape),
    "--still-blur-portrait": blur(portrait),
  } as CSSProperties;
  const showing = portraitScreen ? portrait : landscape;

  return (
    <picture>
      <source media={PORTRAIT} srcSet={tall.srcSet} sizes={tall.sizes} />
      <img
        {...wide}
        alt={showing.alt}
        style={{ ...wide.style, ...vars, opacity: shown ? 1 : 0 }}
        data-sanity={showing.dataSanity}
        className="[background-image:var(--still-blur)] bg-cover bg-center object-cover [object-position:var(--still-position)] transition-opacity duration-[1600ms] ease-in-out portrait:[background-image:var(--still-blur-portrait)] portrait:[object-position:var(--still-position-portrait)]"
      />
    </picture>
  );
}
