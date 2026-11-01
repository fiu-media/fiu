"use client";

import { useEffect, useId, useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from "react";
import { displacementMap, supportsLensing } from "@/lib/liquid-glass";

export type LiquidGlassOptions = {
  /** Corner radius in px, or "pill" for a capsule. */
  radius?: number | "pill";
  /** Width of the curved, refracting rim in px. */
  bezel?: number;
  /** Maximum displacement at the rim in px. */
  strength?: number;
  /** Spread between colour channels at the rim (0 = none). */
  aberration?: number;
};

/**
 * Wires an element up as liquid glass. In Chromium this generates a lens displacement map
 * for the element's exact size and returns an SVG filter to render alongside it; the filter
 * is applied through the `--lens` custom property that `.glass` reads in backdrop-filter.
 * Other browsers keep the CSS-only frosted fallback.
 *
 * It also tracks the pointer so `.glass::after` can paint a specular glint under it, and
 * `.glass-piece` can tilt toward it.
 */
export function useLiquidGlass<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { radius = "pill", bezel = 14, strength = 18, aberration = 0.14 }: LiquidGlassOptions = {},
) {
  const id = `lens${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [lensing, setLensing] = useState(false);

  useEffect(() => {
    if (!supportsLensing()) return;
    const el = ref.current;
    if (!el) return;
    setLensing(true);
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const w = Math.round(box ? box.inlineSize : entry.contentRect.width);
      const h = Math.round(box ? box.blockSize : entry.contentRect.height);
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  let filter: ReactNode = null;
  const style: CSSProperties & Record<string, string> = {};

  if (lensing && size && size.w > 0 && size.h > 0) {
    const r = radius === "pill" ? size.h / 2 : radius;
    const rim = Math.min(bezel, size.h / 2, size.w / 2);
    const map = displacementMap({ width: size.w, height: size.h, radius: r, bezel: rim });
    // Alpha is pinned to 1: the backdrop arrives with partial alpha in Chromium, and the three
    // channels are summed, so carrying it through would darken the whole face of the glass.
    const channel = (name: string, scale: number, matrix: string) => (
      <>
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result={`d${name}`}
        />
        <feColorMatrix in={`d${name}`} type="matrix" values={matrix} result={name} />
      </>
    );
    filter = (
      <svg aria-hidden width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
        <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h} colorInterpolationFilters="sRGB">
          <feImage href={map} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="map" />
          {channel("r", strength * (1 + aberration), "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1")}
          {channel("g", strength, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1")}
          {channel("b", strength * (1 - aberration), "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0 1")}
          <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
          <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
        </filter>
      </svg>
    );
    style["--lens"] = `url(#${id})`;
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
    // Normalised -1..1 offset from the centre, read by `.glass-piece` to tilt toward the pointer.
    el.style.setProperty("--tx", String(((event.clientX - rect.left) / rect.width) * 2 - 1));
    el.style.setProperty("--ty", String(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--tx", "0");
    event.currentTarget.style.setProperty("--ty", "0");
  };

  return { filter, style, onPointerMove, onPointerLeave };
}
