import { urlFor } from "./image";

type Source = Parameters<typeof urlFor>[0];

type SanityImage = {
  _key?: string;
  alt: string | null;
  asset: unknown;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  hotspot?: { x: number; y: number } | null;
  lqip: string | null;
  dimensions?: { width: number; height: number } | null;
};

export type RentalImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string;
  /** CSS object-position from the editor's hotspot. */
  position?: string;
};

/** Result shapes of the rentals queries (hand-written until we adopt typegen). */
export type RentalItem = {
  _id: string;
  name: string;
  slug: string;
  brand: string | null;
  summary: string | null;
  keyFeatures: string[] | null;
  category: { _id: string; title: string } | null;
  images: SanityImage[] | null;
  specs?: { _key: string; key: string; value: string }[] | null;
  includedInKit?: string[] | null;
};
export type RentalCategory = { _id: string; title: string; slug: string };
export type RentalsResult = { categories: RentalCategory[]; items: RentalItem[] };
export type CatalogueEntry = {
  _id: string;
  name: string;
  brand: string | null;
  slug: string;
  image: (Omit<SanityImage, "dimensions"> & { _key?: never }) | null;
};

/** A queried Sanity image as a sized, cropped `next/image` source (null without dimensions). */
export function toRentalImage(image: SanityImage, width = 1200): RentalImage | null {
  const { crop, dimensions } = image;
  // Cropped images have no dimensions in the catalogue lookup; fall back to a 4:3 frame.
  const cropW = crop ? 1 - crop.left - crop.right : 1;
  const cropH = crop ? 1 - crop.top - crop.bottom : 1;
  const aspect = dimensions ? (dimensions.width * cropW) / (dimensions.height * cropH) : 4 / 3;
  const w = dimensions ? Math.min(width, Math.round(dimensions.width * cropW)) : width;
  return {
    src: urlFor(image as unknown as Source).width(w).auto("format").url(),
    width: w,
    height: Math.round(w / aspect),
    alt: image.alt ?? "",
    blurDataURL: image.lqip ?? undefined,
    position: image.hotspot ? `${image.hotspot.x * 100}% ${image.hotspot.y * 100}%` : undefined,
  };
}

/** Drafts show up as `drafts.<id>` in preview; items are always referenced by their published id. */
export const publishedId = (id: string) => id.replace(/^drafts\./, "");
