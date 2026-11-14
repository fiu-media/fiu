"use client";

import { getImageProps } from "next/image";
import type { CSSProperties, Ref } from "react";

import { SizedImg } from "@/components/ui/SizedImg";
import { cn } from "@/lib/cn";
import { usePortrait } from "@/lib/hooks/usePortrait";
import { PORTRAIT } from "@/lib/media";
import { omitUndefined } from "@/lib/omitUndefined";
import type { SizedImage } from "@/lib/sizedImage";

type ArtDirectedImageProps = {
  landscape: SizedImage;
  /** The image a portrait screen gets. Without it, `landscape` is used everywhere. */
  portrait?: SizedImage | null | undefined;
  priority?: boolean | undefined;
  sizes: string;
  /** Defaults to the alt of whichever image the screen is showing. */
  alt?: string | undefined;
  /** `data-sanity` value that makes the image clickable in the Presentation tool. */
  dataSanity?: string | undefined;
  /** Fill the parent instead of using the image's own size. */
  fill?: boolean | undefined;
  quality?: number | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** The rendered `<img>`, for callers that read its pixels or layout. */
  imgRef?: Ref<HTMLImageElement> | undefined;
};

const blur = (image: SizedImage) => (image.blurDataURL ? `url("${image.blurDataURL}")` : "none");

/** An image that is a different file on portrait and landscape screens, picked by the browser with no JavaScript. */
export function ArtDirectedImage({
  landscape,
  portrait,
  priority,
  sizes,
  alt,
  dataSanity,
  fill,
  quality,
  className,
  style,
  imgRef,
}: ArtDirectedImageProps) {
  const portraitScreen = usePortrait();

  if (!portrait) {
    return (
      <SizedImg
        image={landscape}
        alt={alt}
        sizes={sizes}
        priority={priority}
        fill={fill}
        quality={quality}
        data-sanity={dataSanity}
        style={style}
        className={className}
        ref={imgRef}
      />
    );
  }

  // Not `preload`: a preload link can't say which of the two sources the screen will pick.
  const eager = priority ? ({ loading: "eager", fetchPriority: "high" } as const) : {};
  const props = (image: SizedImage) =>
    getImageProps({
      src: image.src,
      alt: image.alt,
      sizes,
      ...omitUndefined({ quality }),
      ...(fill ? { fill } : { width: image.width, height: image.height }),
      ...eager,
    }).props;
  const wide = props(landscape);
  const tall = props(portrait);
  // The blur and the crop are CSS variables so the same media query that picks the file picks them too.
  const vars: CSSProperties = {
    "--still-position": landscape.position ?? "50% 50%",
    "--still-position-portrait": portrait.position ?? "50% 50%",
    "--still-blur": blur(landscape),
    "--still-blur-portrait": blur(portrait),
  };

  return (
    <picture>
      <source media={PORTRAIT} srcSet={tall.srcSet} sizes={tall.sizes} width={tall.width} height={tall.height} />
      {}
      <img
        {...wide}
        ref={imgRef}
        alt={alt ?? (portraitScreen ? portrait.alt : landscape.alt)}
        style={{ ...wide.style, ...vars, ...style }}
        data-sanity={dataSanity}
        className={cn(
          "[background-image:var(--still-blur)] bg-cover bg-center object-cover [object-position:var(--still-position)] portrait:[background-image:var(--still-blur-portrait)] portrait:[object-position:var(--still-position-portrait)]",
          className,
        )}
      />
    </picture>
  );
}
