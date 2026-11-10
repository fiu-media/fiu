import { describe, expect, it } from "vitest";

import {
  HERO_END,
  HERO_SPIN_SECONDS,
  HERO_TURNS,
  heroSpinAt,
  INTRO_END,
  SLIDE_SECONDS,
  SLIDE_START,
  slideAt,
  SPIN_END,
  spinAt,
  tossAt,
} from "./intro";

const FULL_TURN = -Math.PI * 2;

describe("heroSpinAt", () => {
  it("starts at rest and ends after the full turns", () => {
    expect(heroSpinAt(0)).toBeCloseTo(0);
    expect(heroSpinAt(HERO_SPIN_SECONDS)).toBeCloseTo(FULL_TURN * HERO_TURNS);
  });

  it("holds the endpoints outside the spin", () => {
    expect(heroSpinAt(-1)).toBeCloseTo(0);
    expect(heroSpinAt(HERO_SPIN_SECONDS + 5)).toBeCloseTo(FULL_TURN * HERO_TURNS);
  });

  it("spins up fast: more than half the turn is done by the midpoint", () => {
    expect(heroSpinAt(HERO_SPIN_SECONDS / 2)).toBeLessThan((FULL_TURN * HERO_TURNS) / 2);
  });
});

describe("tossAt", () => {
  it("is on the ground at both ends and at the top of the arc in the middle", () => {
    expect(tossAt(0)).toBeCloseTo(0);
    expect(tossAt(HERO_SPIN_SECONDS / 2)).toBeCloseTo(1);
    expect(tossAt(HERO_SPIN_SECONDS)).toBeCloseTo(0);
  });

  it("stays on the ground outside the spin", () => {
    expect(tossAt(-1)).toBeCloseTo(0);
    expect(tossAt(HERO_SPIN_SECONDS + 5)).toBeCloseTo(0);
  });
});

describe("slideAt", () => {
  it("waits for the glide to start", () => {
    expect(slideAt(0)).toBe(0);
    expect(slideAt(SLIDE_START)).toBe(0);
  });

  it("snaps to the resting position once settled", () => {
    expect(slideAt(SLIDE_START + SLIDE_SECONDS)).toBeCloseTo(1, 2);
    expect(slideAt(SLIDE_START + SLIDE_SECONDS + 0.01)).toBe(1);
    expect(slideAt(SLIDE_START + SLIDE_SECONDS + 5)).toBe(1);
  });

  it("overshoots the resting position on the way", () => {
    const samples = Array.from({ length: 100 }, (_, i) => slideAt(SLIDE_START + (SLIDE_SECONDS * i) / 100));
    expect(Math.max(...samples)).toBeGreaterThan(1);
  });
});

describe("spinAt", () => {
  it("starts at rest and ends a full turn round", () => {
    expect(spinAt(0)).toBeCloseTo(0);
    expect(spinAt(71 / 24)).toBeCloseTo(FULL_TURN);
    expect(spinAt(SPIN_END)).toBeCloseTo(FULL_TURN);
  });

  it("overshoots the turn before settling back", () => {
    expect(spinAt(83 / 24)).toBeCloseTo(FULL_TURN - 0.1);
  });

  it("holds the final angle after the keyframes", () => {
    expect(spinAt(SPIN_END + 10)).toBeCloseTo(FULL_TURN);
  });
});

describe("intro timing", () => {
  it("keeps the demand loop awake for the longer of the two intros", () => {
    expect(INTRO_END).toBe(Math.max(SPIN_END, HERO_END));
  });
});
