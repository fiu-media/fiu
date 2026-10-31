import Image from "next/image";
import type { RentalImage } from "@/sanity/lib/rentals";

/**
 * A rental photo (or a quiet placeholder until Fiú shoots its own). Product shots are padded and
 * shot on white, so they sit whole (`object-contain`) on a white tile instead of being cropped.
 */
export function RentalImageView({
  image,
  placeholder,
  sizes,
  priority,
  className = "",
}: {
  image: RentalImage | null;
  placeholder: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-bg-raised text-sm text-fg-muted ${className}`}>{placeholder}</div>
    );
  }
  return (
    <Image
      src={image.src}
      width={image.width}
      height={image.height}
      alt={image.alt}
      sizes={sizes}
      priority={priority}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL}
      className={`bg-white object-contain ${className}`}
    />
  );
}
