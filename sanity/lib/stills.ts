import { createDataAttribute } from "next-sanity";
import { urlFor } from "./image";

export type HeroStill = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string;
  /** CSS object-position derived from the editor's hotspot. */
  position?: string;
  /** `data-sanity` value that makes the still clickable in the Presentation tool. */
  dataSanity?: string;
};

type Source = Parameters<typeof urlFor>[0];

export type SanityStill = {
  _key: string;
  alt: string | null;
  asset: unknown;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  hotspot?: { x: number; y: number } | null;
  lqip: string | null;
  dimensions: { width: number; height: number } | null;
};

/** Result shape of HOME_STILLS_QUERY (hand-written until we adopt typegen). */
export type HomeStillsResult = { _id: string; stills: SanityStill[] | null } | null;

const HERO_WIDTH = 2400;

/** Turn a queried Sanity image into the shape the hero and the WebGL scene both consume. */
export function toHeroStill(documentId: string, still: SanityStill): HeroStill | null {
  if (!still.dimensions) return null;
  const { crop } = still;
  // Sanity applies the crop on its CDN, so the output aspect ratio is the cropped one.
  const cropW = crop ? 1 - crop.left - crop.right : 1;
  const cropH = crop ? 1 - crop.top - crop.bottom : 1;
  const aspect = (still.dimensions.width * cropW) / (still.dimensions.height * cropH);
  const width = Math.min(HERO_WIDTH, Math.round(still.dimensions.width * cropW));

  return {
    src: urlFor(still as unknown as Source)
      .width(width)
      .auto("format")
      .url(),
    width,
    height: Math.round(width / aspect),
    alt: still.alt ?? "",
    blurDataURL: still.lqip ?? undefined,
    dataSanity: createDataAttribute({
      id: documentId,
      type: "siteSettings",
      path: `homeStills[_key=="${still._key}"]`,
      baseUrl: "/studio",
    }).toString(),
    position: still.hotspot ? `${still.hotspot.x * 100}% ${still.hotspot.y * 100}%` : undefined,
  };
}
