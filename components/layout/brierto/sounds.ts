// The watermark's sound effects, all made in the browser: Web Audio for the fanfare and explosions, speech synthesis for the shout.

const MELODY: [number, OscillatorType][] = [
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

export const LOOP_MS = 3600;
/** Fired on `window` when the splash lifts, so the soundtrack can play the explosions with the blast. */
export const BOOM_EVENT = "brierto-boom";

export function audioContext(): AudioContext | null {
  const Ctor =
    (window.AudioContext as typeof AudioContext | undefined)
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/** Speech synthesis is missing in some browsers and webviews, though the DOM types say it is always there. */
export const speech = () => window.speechSynthesis as SpeechSynthesis | undefined;

export function squeakyVoice(): SpeechSynthesisVoice | undefined {
  const voices = speech()?.getVoices() ?? [];
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

export function playFanfare(ctx: AudioContext, dest: AudioNode, crack: AudioBuffer) {
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

export function explosion(ctx: AudioContext, dest: AudioNode, when: number) {
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

export function crackle(ctx: AudioContext) {
  const length = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  return buffer;
}
