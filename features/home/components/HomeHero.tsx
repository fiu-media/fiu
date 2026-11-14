"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, type ReactNode, useMemo, useRef } from "react";

import { ArtDirectedImage } from "@/components/ui/ArtDirectedImage";
import { HeroFade } from "@/components/ui/HeroFade";
import { splashFadeVars } from "@/features/logo";
import { at } from "@/lib/at";
import { logo } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { usePortrait } from "@/lib/hooks/usePortrait";

import type { HeroStill, HeroStills } from "../mappers";
import { useHeroEdge } from "../useHeroEdge";
import { useHeroIntro, useStillRotation } from "../useHeroIntro";
import { Splash } from "./Splash";

const LogoScene = dynamic(() => import("@/features/logo/LogoScene"), { ssr: false });

/** Mobile only: matches the padding around Home's <main> and HomeScrollLock's BLEED_PX. Symmetric, so the logo stays centred. */
const BLEED_CLASS = "max-md:-inset-y-48";
/**
 * The hidden canvas is never fully transparent: at 0 the browser stops compositing it, and then
 * the scene's quality probe (which runs while it is hidden) misses that cost and reads a slow
 * device as fast. At this it is still invisible.
 */
const HIDDEN_SCENE_OPACITY = 0.001;

/**
 * Home hero (Canva mockup 1): rotating full-bleed stills with the glass logo.
 *
 * Mesh / rim playground controls live at `/dev/logo-playground`.
 */
export function HomeHero({ landscape, portrait }: HeroStills) {
  const portraitScreen = usePortrait();
  const slides = useMemo(() => toSlides(landscape, portrait), [landscape, portrait]);
  const {
    mode,
    sceneTier,
    splashDone,
    spinGo,
    introDone,
    logoAtLeft,
    snapToLeft,
    resumed,
    sceneReady,
    slow,
    onReady,
    onIntroEnd,
    onFail,
    onTooSlow,
  } = useHeroIntro();
  const stillKeys = useMemo(() => slides.map(({ landscape }) => landscape.src), [slides]);
  const index = useStillRotation(stillKeys, introDone);
  const current = index % slides.length;
  // The desktop rail's labels sit on the still's left edge; only a bright one darkens it.
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const showing = slides[current];
  useHeroEdge(images, current, (portraitScreen ? showing?.portrait : showing?.landscape)?.position);
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
        {slides.map(({ landscape, portrait }, i) => (
          <ArtDirectedImage
            key={i}
            landscape={landscape}
            portrait={portrait}
            fill
            quality={90}
            sizes="100vw"
            priority={i === 0}
            dataSanity={(portraitScreen ? portrait : landscape).dataSanity}
            style={{ opacity: i === current ? 1 : 0 }}
            className="transition-opacity duration-[1600ms] ease-in-out"
            imgRef={(img) => {
              images.current[i] = img;
            }}
          />
        ))}
        {/* Mobile: the photo dissolves into the ink over the bleed below the hero, under the logo layers that follow. On
            desktop the hero ends in a hard edge at the fold (other seams are compared on /dev/home-below-fold). */}
        <HeroFade bleed />
        {/* Behind a bright still, the edge under the desktop rail darkens just enough for its labels (--hero-edge, see
            useHeroEdge). Under the logo layers, so it never dims the logo. */}
        <div aria-hidden className="hero-edge pointer-events-none absolute inset-y-0 left-0 hidden w-48 md:block" />

        <SvgLogo
          fading={mode === "live" && sceneReady}
          fadeEased={splashDone && (mode !== "live" || resumed)}
          snapToLeft={snapToLeft}
          atLeft={logoAtLeft}
        />
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

/**
 * The SVG logo: shown on the server render, while the live scene loads, and as the fallback. The live logo starts its
 * spin from this same centred, front-facing pose, then glides to the left on desktop, to a 42vw logo that starts 2vw
 * clear of the side rail (-27vw + 4rem = from 50vw to rail + 2vw + half of 42vw).
 */
function SvgLogo({
  fading,
  fadeEased,
  snapToLeft,
  atLeft,
}: {
  /** The live scene has taken over, so this one is hidden. */
  fading: boolean;
  /** Fade it rather than cut, once the splash has gone. */
  fadeEased: boolean;
  snapToLeft: boolean;
  atLeft: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center",
        fadeEased && "motion-safe:transition-opacity motion-safe:duration-700",
      )}
      style={{ opacity: fading ? 0 : 1 }}
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
          atLeft ? "md:-translate-x-[calc(27vw-4rem-env(safe-area-inset-left))]" : "md:translate-x-0",
        )}
      />
    </div>
  );
}

/** If the 3D scene throws (model or texture failed, context lost), fall back to the SVG logo. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    // The SVG fallback hides the failure visually, so leave a trace for debugging.
    console.error("[HomeHero] live logo failed, showing SVG fallback:", error);
    this.props.onError();
  }
  override render() {
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
    landscape: at(wide, i % wide.length),
    portrait: at(tall, i % tall.length),
  }));
}
