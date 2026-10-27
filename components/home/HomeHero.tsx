"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import logo from "@/public/brand/fiu-logo.svg";
import type { HeroStill } from "@/sanity/lib/stills";

const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });

const ROTATE_SECONDS = 6;

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

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % stills.length), ROTATE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [stills.length]);

  const onReady = useCallback(() => setSceneReady(true), []);
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
    <div className="absolute inset-0 -z-10">
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
          fallback. The live logo starts its spin from this same front-facing pose. */}
      <div
        className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-700 md:justify-start md:pl-[4vw]"
        style={{ opacity: mode === "live" && sceneReady ? 0 : 1 }}
      >
        <Image
          src={logo}
          alt=""
          priority
          sizes="(min-width: 768px) 42vw, 80vw"
          className="h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none"
        />
      </div>

      {mode === "live" && (
        <SceneBoundary onError={onFail}>
          <div
            aria-hidden
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: sceneReady ? 1 : 0 }}
          >
            <LogoScene stills={sceneStills} index={index} onReady={onReady} meshMode="extrude" rimLook="light" />
          </div>
        </SceneBoundary>
      )}
    </div>
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
