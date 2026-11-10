// Intro spin, from the original Blender keyframes (24 fps): a full turn, overshoot, settle.
export const SPIN: [seconds: number, radians: number][] = [
  [0, 0],
  [71 / 24, -Math.PI * 2],
  [83 / 24, -Math.PI * 2 - 0.1],
  [95 / 24, -Math.PI * 2],
];

export const SPIN_END = SPIN[SPIN.length - 1][0];

// Hero intro (`introSlide`): `HERO_TURNS` turns that spin up fast and decelerate like a spun coin,
// then a springy glide to the left that overshoots and settles. Times in seconds.
export const HERO_TURNS = 1;
export const HERO_SPIN_SECONDS = 1.6;
/** Glide starts mid-deceleration so the spin hands over to the move. */
export const SLIDE_START = 0.6;
export const SLIDE_SECONDS = 1.8;
/** Spring: damping ratio < 1 overshoots (0.65 ≈ 7% past the target); omega sets the speed. */
export const SLIDE_DAMPING = 0.65;
export const SLIDE_OMEGA = 5.5;
export const HERO_END = Math.max(HERO_SPIN_SECONDS, SLIDE_START + SLIDE_SECONDS);
/** Longest intro, so the demand loop stays awake for it. */
export const INTRO_END = Math.max(SPIN_END, HERO_END);
/** Mobile has no glide, so the logo is tossed up this fraction of the viewport height and lands. */
export const MOBILE_TOSS = 0.035;

export function heroSpinAt(t: number) {
  const k = Math.min(Math.max(t / HERO_SPIN_SECONDS, 0), 1);
  // k^0.6 front-loads the speed; the cosine ease gives a soft start and a long settle.
  return -Math.PI * 2 * HERO_TURNS * (0.5 - 0.5 * Math.cos(Math.PI * k ** 0.6));
}

/** 0 → 1 → 0 over the spin: the coin-toss arc the mobile logo rides while it spins in place. */
export function tossAt(t: number) {
  const k = Math.min(Math.max(t / HERO_SPIN_SECONDS, 0), 1);
  return Math.sin(Math.PI * k) ** 2;
}

/** Damped-spring step response: 0 → 1 with overshoot, snapped to 1 once settled. */
export function slideAt(t: number) {
  const tau = t - SLIDE_START;
  if (tau <= 0) return 0;
  if (tau >= SLIDE_SECONDS) return 1;
  const z = SLIDE_DAMPING;
  const wd = SLIDE_OMEGA * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * SLIDE_OMEGA * tau) * (Math.cos(wd * tau) + ((z * SLIDE_OMEGA) / wd) * Math.sin(wd * tau));
}

export function spinAt(t: number) {
  for (let i = 1; i < SPIN.length; i++) {
    const [t1, v1] = SPIN[i];
    const [t0, v0] = SPIN[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * k * k * (3 - 2 * k); // smoothstep ≈ Blender's auto-clamped Bézier
    }
  }
  return SPIN[SPIN.length - 1][1];
}
