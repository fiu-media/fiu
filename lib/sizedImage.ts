/** A queried Sanity image (see `sanity/lib/image`) as a sized, cropped `next/image` source: talent portraits, project covers, rental photos. */
export type SizedImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string | undefined;
  /** CSS object-position from the editor's hotspot (for cropped uses like portraits; rentals show whole). */
  position?: string | undefined;
};
