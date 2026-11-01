import { createDataAttribute } from "next-sanity";
import type { InferResultType } from "groqd";
import type { HOME_STILLS_QUERY } from "./queries";
import { urlFor } from "./image";

export type HeroStill = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string;
  /** Precomputed studio tint (hex) for the glass logo; avoids sampling the texture. */
  lightTint?: string;
  /** CSS object-position derived from the editor's hotspot. */
  position?: string;
  /** `data-sanity` value that makes the still clickable in the Presentation tool. */
  dataSanity?: string;
};

/** One still of the home query. */
export type HomeStill = NonNullable<NonNullable<InferResultType<typeof HOME_STILLS_QUERY>>["stills"]>[number];

const HERO_WIDTH = 2400;

/** Turn a queried Sanity image into the shape the hero and the WebGL scene both consume. */
export function toHeroStill(documentId: string, still: HomeStill): HeroStill | null {
  const { asset, crop, dimensions, hotspot } = still;
  if (!dimensions?.width || !dimensions.height) return null;
  // Sanity applies the crop on its CDN, so the output aspect ratio is the cropped one.
  const cropW = crop ? 1 - (crop.left ?? 0) - (crop.right ?? 0) : 1;
  const cropH = crop ? 1 - (crop.top ?? 0) - (crop.bottom ?? 0) : 1;
  const aspect = (dimensions.width * cropW) / (dimensions.height * cropH);
  const width = Math.min(HERO_WIDTH, Math.round(dimensions.width * cropW));

  return {
    src: urlFor({ asset, crop: crop ?? undefined, hotspot: hotspot ?? undefined })
      .width(width)
      .auto("format")
      .url(),
    width,
    height: Math.round(width / aspect),
    alt: still.alt ?? "",
    blurDataURL: still.lqip ?? undefined,
    lightTint: still.lightTint ?? undefined,
    dataSanity: createDataAttribute({
      id: documentId,
      type: "siteSettings",
      path: `homeStills[_key=="${still._key}"]`,
      baseUrl: "/studio",
    }).toString(),
    position: hotspot ? `${(hotspot.x ?? 0.5) * 100}% ${(hotspot.y ?? 0.5) * 100}%` : undefined,
  };
}
