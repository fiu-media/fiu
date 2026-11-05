import type { SanityImageAssetReference, SanityImageCrop, SanityImageDimensions, SanityImageHotspot } from "@/sanity.types";
import { urlFor } from "./image";

/** A queried Sanity image (`alt`, `asset`, `crop`, `hotspot`, `lqip`, optionally `dimensions`), as every image projection returns it. */
export type QueriedImage = {
  alt: string | null;
  asset: SanityImageAssetReference | null;
  crop: SanityImageCrop | null;
  hotspot: SanityImageHotspot | null;
  lqip: string | null;
  dimensions?: SanityImageDimensions | null;
};

export type RentalImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string;
  /** CSS object-position from the editor's hotspot (for cropped uses like portraits; rentals show whole). */
  position?: string;
};

/** A queried Sanity image as a sized, cropped `next/image` source (null without dimensions). */
export function toRentalImage(image: QueriedImage, width = 1200): RentalImage | null {
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

/** The same sizing and cropping for any queried Sanity image (talent portraits, project covers). */
export const toSizedImage = toRentalImage;
export type SizedImage = RentalImage;
