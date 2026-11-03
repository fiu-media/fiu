// The three design treatments on /dev/treatments (issue #50), and what differs between them. The tokens themselves live
// in treatments.css, scoped to `[data-treatment]`; this is the copy and the few values components take as props.

export const TREATMENTS = ["expressive", "middle", "clinical"] as const;
export type Treatment = (typeof TREATMENTS)[number];

export const ASPECTS = ["palette", "type", "glass", "motion", "imagery"] as const;
export type Aspect = (typeof ASPECTS)[number];

export const aspectLabel: Record<Aspect, string> = {
  palette: "Palette",
  type: "Type",
  glass: "Glass, edges and corners",
  motion: "Motion",
  imagery: "Imagery grade",
};

type Info = {
  letter: string;
  title: string;
  summary: string;
  /** Corner radius of a GlassPanel, in px. It is a prop because the refraction lens is drawn to match it. */
  panelRadius: number;
  differs: Record<Aspect, string>;
};

export const treatments: Record<Treatment, Info> = {
  expressive: {
    letter: "A",
    title: "Expressive",
    summary:
      "What's live today. Warm and a little playful: soft serifs that echo the logo's curves, glass that catches the light.",
    panelRadius: 28,
    differs: {
      palette: "Warm paper and ink with a hint of red-brown. Maroon accent, blue focus ring.",
      type: "Fraunces at full softness. Project titles and the slogan in italic.",
      glass:
        "Clear acrylic: grey edge, light bevel, specular highlight, a glint that follows the pointer, and lensing in Chrome. 24–28px cards, round pills.",
      motion: "Pills tilt a few degrees toward the pointer and settle slowly (320ms). Image hovers fade over 500ms.",
      imagery: "Stills as shot, warm.",
    },
  },
  middle: {
    letter: "B",
    title: "Middle ground",
    summary: "The same pieces, calmer. The warmth and the softness come out; the glass and the maroon stay.",
    panelRadius: 20,
    differs: {
      palette: "Neutral off-white and near-black, no warm cast. The same maroon, a shade deeper. Blue focus ring.",
      type: "Fraunces with the softness turned off, a touch heavier and upright. Only the slogan is italic.",
      glass: "Same edge and bevel; the highlight is softer and the glint fainter. 18–20px cards, round pills.",
      motion: "Half the tilt and quicker to settle (220ms). Image hovers fade over 300ms.",
      imagery: "Slightly muted: a little less saturation, a little more contrast.",
    },
  },
  clinical: {
    letter: "C",
    title: "Cold + clinical",
    summary: "Precise and quiet. Cool greys, a strict grotesk and flat glass, with the maroon kept for what needs attention.",
    panelRadius: 8,
    differs: {
      palette: "Cool white and blue-black, cool greys and lines. Maroon only for the current page, the focus ring and errors.",
      type: "Inter Tight for headings, tight and upright, no italics. Wider-spaced small capitals.",
      glass:
        "Flat: a hairline edge only, no bevel, highlight, glint or lensing, and a little more frost on panels. 8px cards, 6px pills.",
      motion: "No tilt or press. Quick, plain transitions (120ms). Image hovers fade over 150ms.",
      imagery: "Cool and desaturated, with a blue wash.",
    },
  },
};
