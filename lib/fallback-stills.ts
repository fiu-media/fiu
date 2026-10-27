import banquet from "@/public/stills/banquet.jpg";
import bouquet from "@/public/stills/bouquet.jpg";
import citrus from "@/public/stills/citrus.jpg";
import conservatory from "@/public/stills/conservatory.jpg";
import fur from "@/public/stills/fur.jpg";
import glow from "@/public/stills/glow.jpg";
import grapes from "@/public/stills/grapes.jpg";
import parlor from "@/public/stills/parlor.jpg";
import pond from "@/public/stills/pond.jpg";
import supper from "@/public/stills/supper.jpg";
import type { HeroStill } from "@/sanity/lib/stills";

// lightTint: precomputed studio temperature for the glass. Keep in sync with scripts/seed.ts.
const bundled = [
  { still: conservatory, lightTint: "#a0957b" },
  { still: banquet, lightTint: "#866249" },
  { still: supper, lightTint: "#916d54" },
  { still: glow, lightTint: "#956444" },
  { still: citrus, lightTint: "#968a77" },
  { still: bouquet, lightTint: "#977980" },
  { still: grapes, lightTint: "#a39f82" },
  { still: pond, lightTint: "#746e67" },
  { still: fur, lightTint: "#8c5648" },
  { still: parlor, lightTint: "#716755" },
];

/** Shown on the home hero until the CMS has stills of its own. */
export const fallbackStills: HeroStill[] = bundled.map(({ still: { src, width, height, blurDataURL }, lightTint }) => ({
  src,
  width,
  height,
  blurDataURL,
  lightTint,
  alt: "",
}));
