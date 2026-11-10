"use client";

import "./brierto-watermark.module.css";

import { useSearchParams } from "next/navigation";
import { type CSSProperties, Suspense, useEffect, useState } from "react";

import { BOOM_EVENT } from "./sounds";
import { useSoundtrack } from "./useSoundtrack";

const PHRASE = "★ DESIGNED BY BRIERTO ★";
const TILES = Array.from({ length: 30 }, (_, index) => index);
const MARQUEE = Array.from({ length: 16 }, (_, index) => index);
const RING = "DESIGNED BY BRIERTO ★ DESIGNED BY BRIERTO ★ DESIGNED BY BRIERTO ★ DESIGNED BY BRIERTO ★ ";

const BLASTS = [
  { word: "KABOOM", x: "50%", y: "46%", rot: "-6deg", delay: "0s", size: "min(78vw, 28rem)" },
  { word: "BOOM", x: "20%", y: "30%", rot: "-14deg", delay: "0.12s", size: "min(42vw, 16rem)" },
  { word: "POW", x: "78%", y: "24%", rot: "10deg", delay: "0.22s", size: "min(36vw, 14rem)" },
  { word: "BANG", x: "26%", y: "72%", rot: "12deg", delay: "0.34s", size: "min(40vw, 15rem)" },
  { word: "WHAM", x: "76%", y: "70%", rot: "-8deg", delay: "0.46s", size: "min(38vw, 14rem)" },
];

const SPARKS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2 + (index % 3) * 0.4;
  const distance = 90 + (index % 5) * 48;
  return {
    index,
    x: `${12 + ((index * 37) % 76)}%`,
    y: `${10 + ((index * 53) % 80)}%`,
    dx: `${Math.cos(angle) * distance}px`,
    dy: `${Math.sin(angle) * distance}px`,
    delay: `${(index % 6) * 0.07}s`,
    color: ["#ffe600", "#ff00ea", "#00fff2", "#39ff14", "#ff3b00"][index % 5],
  };
});

function splashCovering() {
  const splash = document.querySelector("div.absolute.inset-0.z-20.grid");
  if (!splash) return false;
  const backdrop = splash.querySelector("div.bg-ink");
  if (!backdrop) return true;
  return Number.parseFloat(getComputedStyle(backdrop).opacity) > 0.15;
}

function WatermarkGate() {
  const enabled = useSearchParams().has("watermark");
  useSoundtrack(enabled);

  const [blasting, setBlasting] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer = 0;
    const startedAt = performance.now();
    const watch = () => {
      if (cancelled) return;
      const waitedOut = performance.now() - startedAt > 8000;
      if (splashCovering() && !waitedOut) {
        timer = window.setTimeout(watch, 80);
        return;
      }
      setBlasting(true);
      window.dispatchEvent(new Event(BOOM_EVENT));
      timer = window.setTimeout(() => {
        if (!cancelled) setBlasting(false);
      }, 2200);
    };
    watch();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={blasting ? "brierto-mark brierto-shaking" : "brierto-mark"} aria-hidden="true">
      <div className="brierto-wash" />
      <div className="brierto-tiles">
        {TILES.map((tile) => (
          <span key={tile}>{PHRASE}</span>
        ))}
      </div>
      <div className="brierto-frame" />
      {blasting && (
        <div className="brierto-booms">
          <div className="brierto-boom-flash" />
          <div className="brierto-boom-flash brierto-boom-flash-late" />
          {SPARKS.map((spark) => (
            <span
              key={spark.index}
              className="brierto-spark"
              style={
                {
                  "--x": spark.x,
                  "--y": spark.y,
                  "--dx": spark.dx,
                  "--dy": spark.dy,
                  "--delay": spark.delay,
                  "--color": spark.color,
                } as CSSProperties
              }
            />
          ))}
          {BLASTS.map((blast) => (
            <div
              key={blast.word}
              className="brierto-boom"
              style={
                {
                  "--x": blast.x,
                  "--y": blast.y,
                  "--rot": blast.rot,
                  "--delay": blast.delay,
                  "--size": blast.size,
                } as CSSProperties
              }
            >
              <span>{blast.word}</span>
            </div>
          ))}
        </div>
      )}
      <div className="brierto-hero">
        <svg className="brierto-ring" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path id="brierto-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#brierto-ring">{RING}</textPath>
          </text>
        </svg>
        <div className="brierto-stamp">
          <p className="brierto-kicker">Designed by</p>
          <p className="brierto-name">Brierto</p>
        </div>
      </div>
      <div className="brierto-marquee brierto-top">
        <div className="brierto-track">
          {MARQUEE.map((item) => (
            <span key={item}>{PHRASE}&nbsp;&nbsp;</span>
          ))}
        </div>
      </div>
      <div className="brierto-marquee brierto-bottom">
        <div className="brierto-track">
          {MARQUEE.map((item) => (
            <span key={item}>{PHRASE}&nbsp;&nbsp;</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BriertoWatermark() {
  return (
    <Suspense fallback={null}>
      <WatermarkGate />
    </Suspense>
  );
}
