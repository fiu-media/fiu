import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import type { SizedImage } from "@/lib/sizedImage";
import type { SanityImageAssetReference, SanityImageCrop, SanityImageDimensions, SanityImageHotspot } from "@/sanity.types";

import { dataset, projectId } from "../env";

export type { SizedImage };

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

/** The share of the image's width and height the editor's crop leaves (1 and 1 without a crop). */
function keptByCrop(crop: SanityImageCrop | null) {
  // The generated types say every crop field is present; these defaults cover data that omits one.
  /* eslint-disable @typescript-eslint/no-unnecessary-condition */
  return {
    width: crop ? 1 - (crop.left ?? 0) - (crop.right ?? 0) : 1,
    height: crop ? 1 - (crop.top ?? 0) - (crop.bottom ?? 0) : 1,
  };
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

/** The hotspot as a CSS `object-position`, or undefined when the editor set none. */
function hotspotPosition(hotspot: SanityImageHotspot | null) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- as above
  return hotspot ? `${(hotspot.x ?? 0.5) * 100}% ${(hotspot.y ?? 0.5) * 100}%` : undefined;
}

/** A queried Sanity image as a sized, cropped `next/image` source (null without dimensions). */
export function toSizedImage(image: QueriedImage, width = 1200): SizedImage | null {
  const { asset, crop, hotspot } = image;
  if (!asset) return null;
  const dimensions =
    image.dimensions?.width && image.dimensions.height
      ? { width: image.dimensions.width, height: image.dimensions.height }
      : null;
  // Cropped images have no dimensions in the catalogue lookup; fall back to a 4:3 frame.
  const kept = keptByCrop(crop);
  const aspect = dimensions ? (dimensions.width * kept.width) / (dimensions.height * kept.height) : 4 / 3;
  const w = dimensions ? Math.min(width, Math.round(dimensions.width * kept.width)) : width;
  return {
    src: urlFor({ asset, crop: crop ?? undefined, hotspot: hotspot ?? undefined })
      .width(w)
      .auto("format")
      .url(),
    width: w,
    height: Math.round(w / aspect),
    alt: image.alt ?? "",
    blurDataURL: image.lqip ?? undefined,
    position: hotspotPosition(hotspot),
  };
}

/** Drafts show up as `drafts.<id>` in preview; items are always referenced by their published id. */
export const publishedId = (id: string) => id.replace(/^drafts\./, "");
