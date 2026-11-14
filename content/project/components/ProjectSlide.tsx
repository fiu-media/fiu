"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { ArtDirectedImage } from "@/components/ui/ArtDirectedImage";
import { FullBleedSlide } from "@/components/ui/FullBleedScroll";
import { GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { format } from "@/lib/i18n/format";
import { parseVimeo, vimeoEmbedUrl } from "@/lib/vimeo";
import type { SizedImage } from "@/sanity/lib/image";

import { VIMEO_FRAME_STYLE } from "../video/frame";
import { PreviewLoop } from "../video/PreviewLoop";
import { usePlayback } from "../video/usePlayback";

export type ProjectSlideProps = {
  /** Accessible name for the slide, e.g. "Solas, 2 of 5". */
  label: string;
  title: string;
  /** One line under the title: type, year, client. */
  meta: string;
  /** `data-sanity` value that makes the title clickable in the Presentation tool. */
  titleAttribute?: string | undefined;
  /** What this person did on the project (talent pages only). */
  role?: string | undefined;
  /** The project's own page. With it, the title links there and a "view" pill sits beside Play. */
  href?: string | undefined;
  /** Heading level for the title: the project's own page makes it the page's `<h1>`. */
  as?: "h1" | "h2" | undefined;
  /** Overrides the slide's size (the project page's hero is shorter than a screen). */
  className?: string | undefined;
  image: SizedImage | null;
  /** Portrait cover for portrait screens (phones). Without one, `image` is cropped to fit. */
  mobileImage?: SizedImage | null | undefined;
  vimeoUrl?: string | null | undefined;
  /** Short silent loop shown while the slide is on screen (a Vimeo background embed, which needs Vimeo Plus). */
  previewLoopUrl?: string | null | undefined;
  /** The first slide loads eagerly; the rest are lazy. */
  priority?: boolean | undefined;
  dict: { play: string; playTitle: string; stop: string; view?: string | undefined };
};

/**
 * One full-bleed project: the cover still, a preview loop behind it when the project has one, and
 * a play button that swaps the Vimeo player into the slide. Without a Vimeo URL it is just the cover.
 */
export function ProjectSlide({
  label,
  title,
  meta,
  titleAttribute,
  role,
  href,
  as: Heading = "h2",
  className,
  image,
  mobileImage,
  vimeoUrl,
  previewLoopUrl,
  priority,
  dict,
}: ProjectSlideProps) {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const video = parseVimeo(vimeoUrl);
  const loop = parseVimeo(previewLoopUrl);
  const { playing, revealed, fullscreen, tapInPlayer, playFullscreenNatively, play, stop, setPlayerFrame, onScreen } =
    usePlayback(root, {
      video,
    });

  const showLoop = loop !== null && onScreen && !playing && !reducedMotion;

  return (
    <FullBleedSlide label={label} className={className}>
      <div ref={root} tabIndex={-1} className="absolute inset-0 outline-none">
        {image ? (
          <ArtDirectedImage
            landscape={image}
            portrait={mobileImage}
            sizes="100vw"
            priority={priority}
            className="absolute inset-0 size-full"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-bg-raised" />
        )}

        {showLoop && <PreviewLoop src={vimeoEmbedUrl(loop, { background: true })} title={title} />}

        {!playing && (
          // Keeps the white logo, filter pills and counter legible over bright covers.
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-scrim/45 to-transparent"
          />
        )}

        {playing && !fullscreen && (
          // Before the player in the DOM, so Tab goes from Stop into the player; z-10 keeps it above it.
          // Not while the slide is full screen: the video has the whole screen, and leaving full screen brings Stop back.
          // On phones the floating menu button sits in the top corner, so Stop goes beneath it.
          <div className="absolute top-[calc(max(1.25rem,env(safe-area-inset-top))+4rem)] right-4 z-10 md:top-6 md:right-6">
            <GlassPillButton data-stop size="md" onImage onClick={stop}>
              {dict.stop}
            </GlassPillButton>
          </div>
        )}

        {playing && video ? (
          <iframe
            ref={setPlayerFrame}
            src={vimeoEmbedUrl(video, {
              autoplay: !tapInPlayer,
              playsinline: playFullscreenNatively ? false : undefined,
            })}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={VIMEO_FRAME_STYLE}
            className={cn(
              "absolute inset-0 size-full border-0 bg-scrim transition-opacity duration-500 motion-reduce:transition-none",
              revealed ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <SlideCaption
            Heading={Heading}
            title={title}
            titleAttribute={titleAttribute}
            meta={meta}
            role={role}
            href={href}
            dict={dict}
            onPlay={video ? play : undefined}
          />
        )}

        {playing && !revealed && (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center bg-scrim/30">
            <div className="size-10 animate-spin rounded-full border-2 border-on-image/25 border-t-on-image motion-reduce:animate-none" />
          </div>
        )}
      </div>
    </FullBleedSlide>
  );
}

type SlideCaptionProps = Pick<ProjectSlideProps, "title" | "meta" | "titleAttribute" | "role" | "href" | "dict"> & {
  Heading: "h1" | "h2";
  /** Set when the project has a video; the Play pill appears with it. */
  onPlay: (() => void) | undefined;
};

/** The title, meta line and role over the cover, with the "view" and Play pills beside them. */
function SlideCaption({ Heading, title, titleAttribute, meta, role, href, dict, onPlay }: SlideCaptionProps) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-scrim/75 via-scrim/30 to-transparent px-5 pt-32 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-10",
        href && "max-sm:flex-col max-sm:items-start",
      )}
    >
      <div className="min-w-0">
        <Heading data-sanity={titleAttribute} className="font-display text-4xl text-balance italic md:text-7xl">
          {href ? (
            <Link href={href} className="hover:underline focus-visible:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        <p className="mt-1 text-sm text-on-image/80 md:text-base">{meta}</p>
        {role && <p className="mt-1 text-sm text-on-image/65">{role}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-3">
        {href && dict.view && (
          <GlassPillLink href={href} size="lg" onImage aria-label={`${dict.view}: ${title}`}>
            {dict.view}
          </GlassPillLink>
        )}
        {onPlay && (
          <GlassPillButton
            data-play
            size="lg"
            onImage
            onClick={onPlay}
            aria-label={format(dict.playTitle, { title })}
            className="shrink-0"
          >
            <Play aria-hidden fill="currentColor" className="size-4" />
            <span className="max-sm:sr-only">{dict.play}</span>
          </GlassPillButton>
        )}
      </div>
    </div>
  );
}
