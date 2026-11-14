"use client";

import { Tabs } from "@base-ui/react/tabs";
import useEmblaCarousel from "embla-carousel-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { StepButton } from "@/components/ui/StepButton";
import { cn } from "@/lib/cn";
import { useStepper } from "@/lib/hooks/useStepper";
import { useSwipe } from "@/lib/hooks/useSwipe";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import type { SizedImage } from "@/sanity/lib/image";

import { RentalImageView } from "./RentalImageView";

/** How far (px) a pointer must travel sideways on the large view to count as a swipe. */
const SWIPE_DISTANCE = 40;

/**
 * The item page's photos: a swipeable large view that cross-fades, with previous/next buttons, and a strip of
 * thumbnails kept in sync with it. It is the APG "tabbed carousel": the thumbnails are Base UI tabs (one Tab stop,
 * arrows and Home/End move between them and show the photo) and the photos are their panels. Arrow keys on the large
 * view change the photo too, without moving focus.
 */
export function RentalGallery({ images, name, dict }: { images: SizedImage[]; name: string; dict: Dictionary["rentals"] }) {
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

function Carousel({ images, name, dict }: { images: SizedImage[]; name: string; dict: Dictionary["rentals"] }) {
  const [stripViewport, strip] = useEmblaCarousel({ containScroll: "keepSnaps", dragFree: true });
  const [index, setIndex] = useState(0);
  // Which ends of the thumbnail strip have more to scroll to (the strip has no scrollbar, so we fade them instead).
  const [more, setMore] = useState({ start: false, end: false });

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

  const { select, onKeyDown } = useStepper(images.length, index, setIndex);
  // The arrow keys step the photos from anywhere in the large view (the photo or its buttons). The handler sits on the
  // root, which is a component rather than a DOM element, and only acts for the large view: the thumbnails are Base UI
  // tabs, which handle their own arrow keys.
  const largeView = useRef<HTMLDivElement>(null);
  const onLargeViewKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof Node && largeView.current?.contains(event.target)) onKeyDown(event);
  };
  const swipe = useSwipe((direction) => select(index + direction), SWIPE_DISTANCE);

  return (
    <Tabs.Root
      value={index}
      onValueChange={(next: number) => setIndex(next)}
      role="group"
      aria-roledescription="carousel"
      aria-label={format(dict.galleryLabel, { name })}
      onKeyDown={onLargeViewKeyDown}
      className="flex flex-col gap-4"
    >
      {/* The carousel steps with the arrow keys, so the large view has to take focus; a named region may. */}
      <div ref={largeView} role="region" aria-label={dict.largePhoto} tabIndex={0} className="relative rounded-3xl">
        <div {...swipe} className="touch-pan-y overflow-hidden rounded-3xl bg-white">
          <div className="grid">
            {/* Every panel stays laid out (Base UI's `hidden` is overridden) so they can cross-fade; the hidden ones are
                inert, which keeps them out of the accessibility tree and the tab order. */}
            {images.map((image, i) => (
              <Tabs.Panel
                key={image.src}
                value={i}
                keepMounted
                aria-roledescription="slide"
                // Named for what it shows, not after its thumbnail ("Show photo…"), as in the APG tabbed carousel.
                aria-labelledby={undefined}
                aria-label={format(dict.photoOf, { n: i + 1, total: images.length })}
                inert={i !== index}
                tabIndex={-1}
                className={cn(
                  "col-start-1 row-start-1 transition-opacity duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none [&[hidden]]:block",
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
              </Tabs.Panel>
            ))}
          </div>
        </div>
        <StepButton tone="dark" label={dict.previousImage} side="left" onClick={() => select(index - 1)} />
        <StepButton tone="dark" label={dict.nextImage} side="right" onClick={() => select(index + 1)} />
      </div>
      <div
        ref={stripViewport}
        style={{ maskImage: stripFade(more), WebkitMaskImage: stripFade(more) }}
        className="overflow-hidden"
      >
        {/* The tab list is Embla's container, so the tabs are its slides. */}
        <Tabs.List activateOnFocus className="flex gap-3 p-1.5 pb-2.5">
          {images.map((image, i) => (
            <Tabs.Tab
              key={image.src}
              value={i}
              onClick={(event) => {
                // Safari doesn't focus a button on click, which would leave the arrow keys dead.
                event.currentTarget.focus();
              }}
              aria-label={format(dict.showImage, { n: i + 1, total: images.length })}
              className="block shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-1 ring-line ring-offset-2 ring-offset-bg transition-shadow hover:ring-fg-muted data-active:ring-2 data-active:ring-fg"
            >
              <RentalImageView image={image} placeholder="" sizes="96px" className="size-20 sm:size-24" />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </div>
    </Tabs.Root>
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
