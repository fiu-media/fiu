"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import type { RentalImage } from "@/sanity/lib/rentals";
import { RentalImageView } from "./RentalImageView";

/**
 * The item page's photos: one large view with previous/next buttons, and a strip of thumbnails
 * that swaps it. Arrow keys (and Home/End) work from the large view or from any thumbnail.
 */
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
  const many = images.length > 1;

  function select(next: number) {
    const target = (next + images.length) % images.length;
    setIndex(target);
    // Keep the chosen thumbnail visible in the scrolling strip.
    thumbs.current[target]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    return target;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!many) return;
    const target =
      event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? images.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    const next = select(target);
    // From a thumbnail, focus follows the selection; from the large view it stays put.
    if (thumbs.current.includes(event.target as HTMLButtonElement)) thumbs.current[next]?.focus();
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={format(dict.galleryLabel, { name })}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-4"
    >
      <div tabIndex={many ? 0 : undefined} className="relative rounded-3xl">
        <RentalImageView
          image={current}
          placeholder={dict.noImage}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={index === 0}
          className="aspect-[4/3] w-full rounded-3xl"
        />
        {many && (
          <>
            <StepButton label={dict.previousImage} side="left" onClick={() => select(index - 1)} />
            <StepButton label={dict.nextImage} side="right" onClick={() => select(index + 1)} />
          </>
        )}
      </div>
      {many && (
        <ul className="flex gap-3 overflow-x-auto p-1.5 pb-2.5">
          {images.map((image, i) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                ref={(node) => {
                  thumbs.current[i] = node;
                }}
                onClick={(event) => {
                  select(i);
                  // Safari doesn't focus a button on click, which would leave the arrow keys dead.
                  event.currentTarget.focus();
                }}
                aria-label={format(dict.showImage, { n: i + 1, total: images.length })}
                aria-current={i === index}
                className={`block cursor-pointer overflow-hidden rounded-2xl ring-offset-2 ring-offset-bg transition-shadow ${
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

function StepButton({ label, side, onClick }: { label: string; side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 ${side === "left" ? "left-3" : "right-3"} grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
