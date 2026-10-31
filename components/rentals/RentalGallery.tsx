"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import type { RentalImage } from "@/sanity/lib/rentals";
import { RentalImageView } from "./RentalImageView";

/** The item page's photos: one large view, with a strip of thumbnails that swaps it. */
export function RentalGallery({
  images,
  name,
  dict,
}: {
  images: RentalImage[];
  name: string;
  dict: Dictionary["rentals"];
}) {
  const [index, setIndex] = useState(0);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = images[index] ?? null;

  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + images.length) % images.length;
    setIndex(next);
    thumbs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <RentalImageView
        image={current}
        placeholder={dict.noImage}
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority={index === 0}
        className="aspect-[4/3] w-full rounded-3xl"
      />
      {images.length > 1 && (
        <ul
          aria-label={format(dict.galleryLabel, { name })}
          onKeyDown={onKeyDown}
          className="flex gap-3 overflow-x-auto p-1 pb-2"
        >
          {images.map((image, i) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                ref={(node) => {
                  thumbs.current[i] = node;
                }}
                onClick={() => setIndex(i)}
                aria-label={format(dict.showImage, { n: i + 1, total: images.length })}
                aria-current={i === index}
                tabIndex={i === index ? 0 : -1}
                className={`block overflow-hidden rounded-2xl ring-offset-2 ring-offset-bg transition-shadow ${
                  i === index ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-fg-muted"
                }`}
              >
                <RentalImageView image={image} placeholder="" sizes="96px" className="size-20 sm:size-24" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
