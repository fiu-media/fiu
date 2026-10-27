import candle from "@/public/stills/candle.jpg";
import flowers from "@/public/stills/flowers.jpg";
import jackets from "@/public/stills/jackets.jpg";
import type { HeroStill } from "@/sanity/lib/stills";

/** Shown on the home hero until the CMS has stills of its own. */
export const fallbackStills: HeroStill[] = [candle, flowers, jackets].map(({ src, width, height, blurDataURL }) => ({
  src,
  width,
  height,
  blurDataURL,
  alt: "",
}));
