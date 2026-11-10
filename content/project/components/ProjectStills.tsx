"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { SizedImg } from "@/components/ui/SizedImg";
import { StepButton } from "@/components/ui/StepButton";
import { cn } from "@/lib/cn";
import { useStepper } from "@/lib/hooks/useStepper";
import { useSwipe } from "@/lib/hooks/useSwipe";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import type { SizedImage } from "@/sanity/lib/image";

/** One still twice over: a small one for the grid, a large one for the lightbox. */
export type Still = { thumb: SizedImage; full: SizedImage };

type Dict = Pick<Dictionary["work"], "stills" | "openStill" | "closeStill" | "previousStill" | "nextStill" | "stillCounter">;

/** How far (px) a pointer must travel sideways on the large view to count as a swipe. */
const SWIPE_DISTANCE = 50;

/**
 * The project's stills. Every thumbnail is cropped to the same frame (16:9, or 9:16 for the portrait set) so the
 * grid stays even whatever the originals' shapes, and the editor's hotspot picks what stays in frame. Clicking one
 * opens a lightbox with the whole still, stepped through with buttons, arrow keys or a swipe.
 *
 * Portrait screens get the portrait set when there is one. The other set is `display: none`, so its images never load.
 */
export function ProjectStills({ landscape, portrait, dict }: { landscape: Still[]; portrait: Still[]; dict: Dict }) {
  // Closing only clears `open`, so the lightbox keeps its still while it fades out.
  const [view, setView] = useState<{ set: "landscape" | "portrait"; index: number; open: boolean } | null>(null);
  const stills = view ? (view.set === "portrait" ? portrait : landscape) : [];

  return (
    <>
      {landscape.length > 0 && (
        <Grid
          set="landscape"
          stills={landscape}
          dict={dict}
          onOpen={(index) => setView({ set: "landscape", index, open: true })}
          className={cn("grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", portrait.length > 0 && "portrait:hidden")}
          frame="aspect-video"
          sizes="(min-width: 1152px) 360px, (min-width: 640px) 45vw, 100vw"
        />
      )}
      {portrait.length > 0 && (
        <Grid
          set="portrait"
          stills={portrait}
          dict={dict}
          onOpen={(index) => setView({ set: "portrait", index, open: true })}
          className={cn("hidden grid-cols-2 md:grid-cols-3 portrait:grid", landscape.length === 0 && "max-md:grid")}
          frame="aspect-[9/16]"
          sizes="(min-width: 768px) 30vw, 50vw"
        />
      )}
      {view && (
        <Lightbox
          open={view.open}
          onOpenChange={(open) => setView({ ...view, open })}
          stills={stills}
          index={view.index}
          onIndex={(index) => setView({ ...view, index })}
          dict={dict}
        />
      )}
    </>
  );
}

function Grid({
  set,
  stills,
  dict,
  onOpen,
  className,
  frame,
  sizes,
}: {
  set: string;
  stills: Still[];
  dict: Dict;
  onOpen: (index: number) => void;
  className: string;
  frame: string;
  sizes: string;
}) {
  return (
    <ul data-stills={set} className={cn("grid gap-3 md:gap-4", className)}>
      {stills.map(({ thumb }, i) => (
        <li key={thumb.src}>
          <button
            type="button"
            onClick={() => onOpen(i)}
            aria-haspopup="dialog"
            aria-label={format(dict.openStill, { n: i + 1, total: stills.length })}
            className={cn("group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-bg-raised", frame)}
          >
            <SizedImg
              image={thumb}
              fill
              sizes={sizes}
              loading="lazy"
              className="transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Lightbox({
  open,
  onOpenChange,
  stills,
  index,
  onIndex,
  dict,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stills: Still[];
  index: number;
  onIndex: (index: number) => void;
  dict: Dict;
}) {
  const many = stills.length > 1;
  const { select, onKeyDown } = useStepper(stills.length, index, onIndex);
  const swipe = useSwipe((direction) => many && select(index + direction), SWIPE_DISTANCE);
  const current = stills[index];
  if (!current) return null;

  // The neighbours load while this one is looked at, so stepping doesn't wait.
  const neighbours = many ? [stills[(index + 1) % stills.length]!, stills[(index - 1 + stills.length) % stills.length]!] : [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-scrim/95 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col text-on-image transition-opacity duration-300 outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
        >
          <Dialog.Title className="sr-only">{dict.stills}</Dialog.Title>
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-6">
            <p aria-live="polite" className="text-sm text-on-image/80 tabular-nums">
              {format(dict.stillCounter, { n: index + 1, total: stills.length })}
            </p>
            <Dialog.Close
              aria-label={dict.closeStill}
              className="grid size-11 cursor-pointer place-items-center rounded-full bg-on-image/10 hover:bg-on-image/20"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>

          <div {...swipe} className="relative min-h-0 flex-1 touch-pan-y px-4 py-4 select-none md:px-20">
            <SizedImg key={current.full.src} image={current.full} fit="contain" sizes="100vw" priority className="size-full" />
            {many && (
              <>
                <StepButton tone="light" label={dict.previousStill} side="left" onClick={() => select(index - 1)} />
                <StepButton tone="light" label={dict.nextStill} side="right" onClick={() => select(index + 1)} />
              </>
            )}
          </div>
          <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />

          {neighbours.map((still) => (
            <Image
              key={still.full.src}
              src={still.full.src}
              width={still.full.width}
              height={still.full.height}
              alt=""
              sizes="100vw"
              loading="eager"
              aria-hidden
              className="hidden"
            />
          ))}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
