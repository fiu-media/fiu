import type { Team } from "@/content/siteSettings";
import { at } from "@/lib/at";
import type { SizedImage } from "@/lib/sizedImage";

import banquet from "./banquet.jpg";
import bouquet from "./bouquet.jpg";
import citrus from "./citrus.jpg";
import conservatory from "./conservatory.jpg";
import fur from "./fur.jpg";
import glow from "./glow.jpg";
import grapes from "./grapes.jpg";
import parlor from "./parlor.jpg";
import pond from "./pond.jpg";
import supper from "./supper.jpg";

// lightTint: precomputed studio temperature for the glass, so the playground needn't sample its textures.
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

/** A stand-in still, with the studio temperature of its light already worked out. */
type DevStill = SizedImage & { lightTint: string };

/**
 * Stand-in stills for the sign-off pages under `/dev`, which need pictures before the CMS has them. They live here,
 * not in `public/`, so the live site can't show one: its pages draw what the editors uploaded, or nothing.
 */
export const devStills: DevStill[] = bundled.map(({ still: { src, width, height, blurDataURL }, lightTint }) => ({
  src,
  width,
  height,
  blurDataURL,
  lightTint,
  alt: "",
}));

/** A stand-in team photo for the sign-off pages, until the editors upload one (Site settings → About). */
export const standInTeam = (heading: string): Team => ({ image: at(devStills, 2), heading, caption: null });
