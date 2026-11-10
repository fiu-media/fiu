import Image from "next/image";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/image";

type SizedImgProps = Omit<ComponentProps<typeof Image>, "src" | "width" | "height" | "alt" | "placeholder" | "blurDataURL"> & {
  image: SizedImage;
  /** Defaults to the image's own alt; pass `""` for a decorative use. */
  alt?: string;
  /** `cover` crops to the frame around the editor's hotspot; `contain` shows the whole image. */
  fit?: "cover" | "contain";
};

/** A queried Sanity image with its blur placeholder and hotspot position wired up. The caller sets the size and shape. */
export function SizedImg({ image, alt = image.alt, fit = "cover", fill, className, style, ...props }: SizedImgProps) {
  return (
    <Image
      src={image.src}
      {...(fill ? { fill } : { width: image.width, height: image.height })}
      alt={alt}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL}
      // The hotspot only means something when the image is cropped; a whole image is never repositioned.
      style={fit === "cover" ? { objectPosition: image.position, ...style } : style}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
      {...props}
    />
  );
}
