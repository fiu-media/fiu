import { Fraunces, Instrument_Serif, Inter, Inter_Tight, Manrope } from "next/font/google";

// Candidate pairings. Once one is chosen it moves to app/layout.tsx and this file goes away.

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-inter-tight",
});
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-serif",
});
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
});
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope" });

export const pairings = [
  {
    id: "a",
    name: "Clean grotesk",
    faces: "Inter Tight + Inter",
    note: "Neutral and modern. The glass logo carries all the personality; the type stays out of the way.",
    className: `${interTight.variable} ${inter.variable}`,
    display: "var(--font-inter-tight)",
    text: "var(--font-inter)",
    displayStyle: "font-semibold tracking-[-0.035em]",
    italicAccent: false,
  },
  {
    id: "b",
    name: "Editorial",
    faces: "Instrument Serif + Inter",
    note: "Film-festival feel. The serif italic suits the slogan and project titles; Inter keeps the UI crisp.",
    className: `${instrumentSerif.variable} ${inter.variable}`,
    display: "var(--font-instrument-serif)",
    text: "var(--font-inter)",
    displayStyle: "font-normal tracking-[-0.02em]",
    italicAccent: true,
  },
  {
    id: "c",
    name: "Expressive",
    faces: "Fraunces + Manrope",
    note: "Warm and a little playful, with soft serifs that echo the logo's curves. Manrope is friendly but still precise.",
    className: `${fraunces.variable} ${manrope.variable}`,
    display: "var(--font-fraunces)",
    text: "var(--font-manrope)",
    displayStyle: "font-[450] tracking-[-0.03em] [font-variation-settings:'SOFT'_100,'opsz'_144]",
    italicAccent: true,
  },
] as const;

export type Pairing = (typeof pairings)[number];
