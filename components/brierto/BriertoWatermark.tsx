"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import "./brierto-watermark.module.css";

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

function audioContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

function squeakyVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find((voice) => /zarvox|bad news|bahh|bells|boing|junior|superstar|albert/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    voices[0]
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
    const onGesture = () => {
      if (!started) {
        shout(true);
        skipNextShout = true;
      }
      arm();
    };

    arm();
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(voiceTimer);
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      document.removeEventListener("visibilitychange", onHide);
      window.speechSynthesis?.cancel();
      void ctx?.close();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="brierto-mark" aria-hidden="true">
      <div className="brierto-wash" />
      <div className="brierto-tiles">
        {TILES.map((tile) => (
          <span key={tile}>{PHRASE}</span>
        ))}
      </div>
      <div className="brierto-frame" />
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
