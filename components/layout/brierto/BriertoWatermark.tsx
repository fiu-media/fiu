"use client";

import "./brierto-watermark.module.css";

import { useSearchParams } from "next/navigation";
import { type CSSProperties, Suspense, useEffect, useState } from "react";

const PHRASE = "★ DESIGNED BY BRIERTO ★";
const TILES = Array.from({ length: 30 }, (_, index) => index);
const MARQUEE = Array.from({ length: 16 }, (_, index) => index);
const RING = "DESIGNED BY BRIERTO ★ DESIGNED BY BRIERTO ★ DESIGNED BY BRIERTO ★ DESIGNED BY BRIERTO ★ ";

const MELODY: Array<[number, OscillatorType]> = [
  [523.25, "square"],
  [659.25, "square"],
  [783.99, "square"],
  [1046.5, "square"],
  [783.99, "sawtooth"],
  [659.25, "square"],
  [523.25, "square"],
  [392, "sawtooth"],
  [523.25, "square"],
  [659.25, "square"],
  [783.99, "square"],
  [1046.5, "sawtooth"],
];

const LOOP_MS = 3600;
const BOOM_EVENT = "brierto-boom";

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

function audioContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

function squeakyVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find((voice) => /zarvox|bad news|bahh|bells|boing|junior|superstar|albert/i.test(voice.name))
    ?? voices.find((voice) => voice.lang.startsWith("en"))
    ?? voices[0]
  );
}

function blip(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  when: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function noiseCrack(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, when: number) {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(0.55, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  source.start(when);
}

function airhorn(ctx: AudioContext, dest: AudioNode, when: number) {
  [73.4, 146.8, 155.6, 293.7].forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index === 3 ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, when + 0.55);
    gain.gain.setValueAtTime(index === 0 ? 0.34 : 0.2, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.62);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + 0.64);
  });
}

function slideWhistle(ctx: AudioContext, dest: AudioNode, when: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1700, when);
  osc.frequency.exponentialRampToValueAtTime(160, when + 0.48);
  gain.gain.setValueAtTime(0.38, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  osc.stop(when + 0.52);
}

function boing(ctx: AudioContext, dest: AudioNode, when: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(640, when);
  osc.frequency.exponentialRampToValueAtTime(80, when + 0.38);
  gain.gain.setValueAtTime(0.46, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  osc.stop(when + 0.42);
}

function playFanfare(ctx: AudioContext, dest: AudioNode, crack: AudioBuffer) {
  const now = ctx.currentTime + 0.02;
  noiseCrack(ctx, dest, crack, now);
  MELODY.forEach(([freq, type], index) => {
    blip(ctx, dest, freq, type, now + index * 0.11, 0.1, 0.32);
  });
  const after = now + MELODY.length * 0.11;
  airhorn(ctx, dest, after);
  slideWhistle(ctx, dest, after + 0.66);
  boing(ctx, dest, after + 1.2);
}

function explosion(ctx: AudioContext, dest: AudioNode, when: number) {
  const duration = 0.8;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 1.4;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(5400, when);
  filter.frequency.exponentialRampToValueAtTime(120, when + duration);
  gain.gain.setValueAtTime(0.95, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  source.start(when);

  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(150, when);
  thump.frequency.exponentialRampToValueAtTime(28, when + 0.45);
  thumpGain.gain.setValueAtTime(0.85, when);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
  thump.connect(thumpGain);
  thumpGain.connect(dest);
  thump.start(when);
  thump.stop(when + 0.52);
}

function crackle(ctx: AudioContext) {
  const length = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  return buffer;
}

function WatermarkGate() {
  const enabled = useSearchParams().has("watermark");

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let started = false;
    let timer = 0;
    let voiceTimer = 0;
    let ctx: AudioContext | null = null;
    let master: GainNode | null = null;
    let crack: AudioBuffer | null = null;

    let skipNextShout = false;
    let boomPlayed = false;
    let boomQueued = false;

    const playBoom = () => {
      if (boomPlayed) return;
      if (!ctx || !master || ctx.state !== "running") {
        boomQueued = true;
        return;
      }
      boomPlayed = true;
      const now = ctx.currentTime + 0.02;
      explosion(ctx, master, now);
      explosion(ctx, master, now + 0.22);
      explosion(ctx, master, now + 0.5);
    };

    const shout = (duringGesture: boolean) => {
      const synth = window.speechSynthesis;
      if (!synth || stopped || document.hidden) return;
      const utter = new SpeechSynthesisUtterance("Designed by Brierto!");
      utter.pitch = 1.9;
      utter.rate = 1.2;
      utter.volume = 1;
      const voice = squeakyVoice();
      if (voice) utter.voice = voice;
      if (!duringGesture && (synth.speaking || synth.pending)) {
        synth.cancel();
        window.clearTimeout(voiceTimer);
        voiceTimer = window.setTimeout(() => {
          if (!stopped && !document.hidden) synth.speak(utter);
        }, 50);
        return;
      }
      synth.speak(utter);
    };

    const tick = () => {
      window.clearTimeout(timer);
      if (stopped || !ctx || !master || !crack || document.hidden) return;
      playFanfare(ctx, master, crack);
      if (skipNextShout) skipNextShout = false;
      else shout(false);
      timer = window.setTimeout(tick, LOOP_MS);
    };

    const arm = () => {
      if (stopped || started) return;
      ctx = ctx ?? audioContext();
      if (!ctx) return;
      if (!master) {
        master = ctx.createGain();
        master.gain.value = 0.95;
        master.connect(ctx.destination);
        crack = crackle(ctx);
      }
      void ctx
        .resume()
        .then(() => {
          if (stopped || started || ctx?.state !== "running") return;
          started = true;
          if (boomQueued) playBoom();
          tick();
        })
        .catch(() => {});
    };

    const onHide = () => {
      if (!document.hidden) {
        if (started && ctx) {
          void ctx
            .resume()
            .then(() => {
              if (!stopped && !document.hidden) tick();
            })
            .catch(() => {});
        }
        return;
      }
      window.clearTimeout(timer);
      window.clearTimeout(voiceTimer);
      window.speechSynthesis?.cancel();
      void ctx?.suspend();
    };

    window.speechSynthesis?.getVoices();
    const onBoom = () => playBoom();
    const onGesture = () => {
      if (!started) {
        shout(true);
        skipNextShout = true;
      }
      arm();
    };

    arm();
    window.addEventListener(BOOM_EVENT, onBoom);
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(voiceTimer);
      window.removeEventListener(BOOM_EVENT, onBoom);
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      document.removeEventListener("visibilitychange", onHide);
      window.speechSynthesis?.cancel();
      void ctx?.close();
    };
  }, [enabled]);

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
