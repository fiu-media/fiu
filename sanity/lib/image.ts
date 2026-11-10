import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import type { SanityImageAssetReference, SanityImageCrop, SanityImageDimensions, SanityImageHotspot } from "@/sanity.types";

import { dataset, projectId } from "../env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/** A queried Sanity image (`alt`, `asset`, `crop`, `hotspot`, `lqip`, optionally `dimensions`), as every image projection returns it. */
export type QueriedImage = {
  alt: string | null;
  asset: SanityImageAssetReference | null;
  crop: SanityImageCrop | null;
  hotspot: SanityImageHotspot | null;
  lqip: string | null;
  dimensions?: SanityImageDimensions | null;
};

/** A queried Sanity image as a sized, cropped `next/image` source: talent portraits, project covers, rental photos. */
export type SizedImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string | undefined;
  /** CSS object-position from the editor's hotspot (for cropped uses like portraits; rentals show whole). */
  position?: string | undefined;
};

/** A queried Sanity image as a sized, cropped `next/image` source (null without dimensions). */
export function toSizedImage(image: QueriedImage, width = 1200): SizedImage | null {
  const { asset, crop, hotspot } = image;
  if (!asset) return null;
  const dimensions =
    image.dimensions?.width && image.dimensions.height
      ? { width: image.dimensions.width, height: image.dimensions.height }
      : null;
  // Cropped images have no dimensions in the catalogue lookup; fall back to a 4:3 frame.
  const cropW = crop ? 1 - (crop.left ?? 0) - (crop.right ?? 0) : 1;
  const cropH = crop ? 1 - (crop.top ?? 0) - (crop.bottom ?? 0) : 1;
  const aspect = dimensions ? (dimensions.width * cropW) / (dimensions.height * cropH) : 4 / 3;
  const w = dimensions ? Math.min(width, Math.round(dimensions.width * cropW)) : width;
  return {
    src: urlFor({ asset, crop: crop ?? undefined, hotspot: hotspot ?? undefined })
      .width(w)
      .auto("format")
      .url(),
    width: w,
    height: Math.round(w / aspect),
    alt: image.alt ?? "",
    blurDataURL: image.lqip ?? undefined,
    position: hotspot ? `${(hotspot.x ?? 0.5) * 100}% ${(hotspot.y ?? 0.5) * 100}%` : undefined,
  };
}

/** Drafts show up as `drafts.<id>` in preview; items are always referenced by their published id. */
export const publishedId = (id: string) => id.replace(/^drafts\./, "");
