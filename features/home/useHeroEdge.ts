"use client";

import { type RefObject, useEffect } from "react";

import { matches, subscribeToMedia } from "@/lib/hooks/useMediaQuery";
import { DESKTOP } from "@/lib/media";

import { coverPlacement, edgeForLuminance, parsePosition, stripLuminance } from "./heroEdge";

/** Read by `.hero-edge` in globals.css: how dark the edge gets, 0 to 1, and how long it takes to get there. */
const HERO_EDGE_VAR = "--hero-edge";
const DURATION_VAR = "--hero-edge-duration";
/** The stills' crossfade (the hero's slides in HomeHero). */
const CROSSFADE_MS = 1600;
/**
 * Never lag a crossfade: when the next still needs more darkening, reach it before that still has faded in; when it
 * needs less, wait until the old still has gone, then ease off.
 */
const RISE_MS = 250;
const FALL_MS = 600;
/** The rail's width, which is the strip of the still the labels sit on. */
const RAIL_PX = 64;
/**
 * The strip is read at this many pixels: about one per 2px of rail, so a bright patch behind a word isn't averaged
 * away with the dark around it (8×48 underread bright patches by up to a third). Still only ~6k pixels, once per still.
 */
const SAMPLE = { w: 32, h: 180 };
/** If the pixels can't be read (a cross-origin still), assume the brightest frame rather than risk unreadable labels. */
const UNREADABLE_EDGE = edgeForLuminance(1);

const cache = new Map<string, number>();
let canvas: HTMLCanvasElement | null = null;
/**
 * The value currently applied, so a change can tell whether it is going up or down. Never cleared on unmount: Home's
 * stand-in hero unmounts after the real one has set it, and only `.hero-edge` (on Home) reads it anyway.
 */
let applied: number | null = null;

function measure(img: HTMLImageElement, position: string | undefined) {
  const box = img.getBoundingClientRect();
  const key = `${img.currentSrc}|${position}|${Math.round(box.width)}x${Math.round(box.height)}|${Math.round(box.top)}|${window.innerHeight}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  let edge = UNREADABLE_EDGE;
  try {
    canvas ??= document.createElement("canvas");
    canvas.width = SAMPLE.w;
    canvas.height = SAMPLE.h;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    // Draw the whole still into the sample as it is laid out on screen, shifted so the sample covers the strip under
    // the rail on the first screen. The five-argument drawImage scales the whole image, so its pixel density can't
    // throw the crop off (a responsive image's naturalWidth is divided by it; its bitmap is not).
    const kx = SAMPLE.w / RAIL_PX;
    const ky = SAMPLE.h / window.innerHeight;
    const placed = coverPlacement(
      { w: img.naturalWidth, h: img.naturalHeight },
      { w: box.width, h: box.height },
      parsePosition(position),
    );
    context.clearRect(0, 0, SAMPLE.w, SAMPLE.h);
    context.drawImage(img, (box.left + placed.x) * kx, (box.top + placed.y) * ky, placed.w * kx, placed.h * ky);
    edge = edgeForLuminance(stripLuminance(context.getImageData(0, 0, SAMPLE.w, SAMPLE.h).data, SAMPLE.w));
  } catch {
    // A tainted canvas or a missing context: keep the safe value.
  }
  cache.set(key, edge);
  return edge;
}

/**
 * Sets `--hero-edge` on the root for the still on screen, so the rail darkens only behind bright stills. The rail's CSS
 * eases the change over the stills' crossfade.
 */
export function useHeroEdge(images: RefObject<(HTMLImageElement | null)[]>, current: number, position: string | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    const img = images.current[current];
    let frame = 0;
    let fall = 0;
    const apply = (edge: number, duration: number) => {
      root.style.setProperty(DURATION_VAR, `${duration}ms`);
      root.style.setProperty(HERO_EDGE_VAR, edge.toFixed(3));
      applied = edge;
    };
    const update = () => {
      // Only the hero on screen: Home's stand-in hero (the Suspense fallback) and the real one can briefly both exist.
      if (!img || !matches(DESKTOP) || !img.isConnected || img.getBoundingClientRect().width === 0) return;
      if (!img.complete || img.naturalWidth === 0) {
        img.addEventListener("load", update, { once: true });
        return;
      }
      const edge = measure(img, position);
      window.clearTimeout(fall);
      if (applied === null || edge >= applied) apply(edge, applied === null ? 0 : RISE_MS);
      else fall = window.setTimeout(() => apply(edge, FALL_MS), CROSSFADE_MS);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("resize", schedule);
    // The rail only exists from `md`.
    const unsubscribe = subscribeToMedia(DESKTOP)(schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fall);
      img?.removeEventListener("load", update);
      window.removeEventListener("resize", schedule);
      unsubscribe();
    };
  }, [images, current, position]);
}
