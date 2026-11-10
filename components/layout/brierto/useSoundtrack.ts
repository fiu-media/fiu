import { useEffect } from "react";

import { audioContext, BOOM_EVENT, crackle, explosion, LOOP_MS, playFanfare, speech, squeakyVoice } from "./sounds";

/** The watermark's soundtrack: a looping fanfare and shout once the browser allows audio, and the explosions on the blast. */
export function useSoundtrack(enabled: boolean) {
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
      const synth = speech();
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
      speech()?.cancel();
      void ctx?.suspend();
    };

    speech()?.getVoices();
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
      speech()?.cancel();
      void ctx?.close();
    };
  }, [enabled]);
}
