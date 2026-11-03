"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import type { RentalImage } from "@/sanity/lib/rentals";
import { RentalImageView } from "./RentalImageView";

/** How far (px) a pointer must travel sideways on the large view to count as a swipe. */
const SWIPE_DISTANCE = 40;

/**
 * The item page's photos: a swipeable large view that cross-fades, with previous/next buttons, and a strip of
 * thumbnails kept in sync with it. Arrow keys (and Home/End) work from the large view or from any thumbnail.
 */
export function RentalGallery({ images, name, dict }: { images: RentalImage[]; name: string; dict: Dictionary["rentals"] }) {
  const many = images.length > 1;

  if (!many) {
    return (
      <RentalImageView
        image={images[0] ?? null}
        placeholder={dict.noImage}
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
        className="aspect-[4/3] w-full rounded-3xl"
      />
    );
  }
  return <Carousel images={images} name={name} dict={dict} />;
}

function Carousel({ images, name, dict }: { images: RentalImage[]; name: string; dict: Dictionary["rentals"] }) {
  const [stripViewport, strip] = useEmblaCarousel({ containScroll: "keepSnaps", dragFree: true });
  const [index, setIndex] = useState(0);
  // Which ends of the thumbnail strip have more to scroll to (the strip has no scrollbar, so we fade them instead).
  const [more, setMore] = useState({ start: false, end: false });
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipeFrom = useRef<number | null>(null);

  useEffect(() => {
    if (!strip) return;
    const measure = () => {
      const next = { start: strip.canScrollPrev(), end: strip.canScrollNext() };
      setMore((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    strip.on("scroll", measure).on("reInit", measure).on("resize", measure);
    return () => {
      strip.off("scroll", measure).off("reInit", measure).off("resize", measure);
    };
  }, [strip]);

  // Keep the chosen thumbnail visible in the strip.
  useEffect(() => {
    strip?.scrollTo(index);
  }, [strip, index]);

  function select(next: number) {
    const target = (next + images.length) % images.length;
    setIndex(target);
    return target;
  }

  function onPointerUp(event: PointerEvent) {
    if (swipeFrom.current === null) return;
    const distance = event.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(distance) >= SWIPE_DISTANCE) select(index + (distance < 0 ? 1 : -1));
  }

  function onKeyDown(event: KeyboardEvent) {
    const target =
      event.key === "ArrowRight"
        ? index + 1
        : event.key === "ArrowLeft"
          ? index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? images.length - 1
              : null;
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
      <div tabIndex={0} className="relative rounded-3xl">
        <div
          onPointerDown={(event) => {
            swipeFrom.current = event.clientX;
          }}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeFrom.current = null;
          }}
          onDragStart={(event) => event.preventDefault()}
          className="touch-pan-y overflow-hidden rounded-3xl bg-white"
        >
          <div className="grid">
            {images.map((image, i) => (
              <div
                key={image.src}
                role="group"
                aria-roledescription="slide"
                aria-label={format(dict.photoOf, { n: i + 1, total: images.length })}
                aria-hidden={i !== index}
                inert={i !== index}
                className={cn(
                  "col-start-1 row-start-1 transition-opacity duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              >
                <RentalImageView
                  image={image}
                  placeholder={dict.noImage}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority={i === 0}
                  loading={isNear(i, index, images.length) ? "eager" : undefined}
                  className="aspect-[4/3] w-full"
                />
              </div>
            ))}
          </div>
        </div>
        <StepButton label={dict.previousImage} side="left" onClick={() => select(index - 1)} />
        <StepButton label={dict.nextImage} side="right" onClick={() => select(index + 1)} />
      </div>
      <div
        ref={stripViewport}
        style={{ maskImage: stripFade(more), WebkitMaskImage: stripFade(more) }}
        className="overflow-hidden"
      >
        <ul className="flex gap-3 p-1.5 pb-2.5">
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
                className={cn(
                  "block cursor-pointer overflow-hidden rounded-2xl ring-offset-2 ring-offset-bg transition-shadow",
                  i === index ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-fg-muted",
                )}
              >
                <RentalImageView image={image} placeholder="" sizes="96px" className="size-20 sm:size-24" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Whether slide `i` is the current slide or one step either side of it (wrapping), so it is loaded before it fades in. */
function isNear(i: number, current: number, total: number) {
  const gap = Math.abs(i - current);
  return Math.min(gap, total - gap) <= 1;
}

/** Fades the strip's edges where more thumbnails are hidden. */
function stripFade({ start, end }: { start: boolean; end: boolean }) {
  return `linear-gradient(to right, ${start ? "transparent" : "#000"} 0, #000 32px, #000 calc(100% - 32px), ${end ? "transparent" : "#000"} 100%)`;
}

function StepButton({ label, side, onClick }: { label: string; side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
