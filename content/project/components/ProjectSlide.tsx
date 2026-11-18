"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { ArtDirectedImage } from "@/components/ui/ArtDirectedImage";
import { Cut, cutName } from "@/components/ui/Cut";
import { FullBleedSlide } from "@/components/ui/FullBleedScroll";
import { GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { format } from "@/lib/i18n/format";
import { parseVimeo, vimeoEmbedUrl, type VimeoRef, vimeoWatchUrl } from "@/lib/vimeo";
import type { SizedImage } from "@/sanity/lib/image";

import { VIMEO_FRAME_STYLE } from "../video/frame";
import { PreviewLoop } from "../video/PreviewLoop";
import { usePlayback } from "../video/usePlayback";

export type ProjectSlideProps = {
  /** Accessible name for the slide, e.g. "Solas, 2 of 5". */
  label: string;
  title: string;
  /** Project slug for analytics when Play is pressed. */
  slug?: string | null | undefined;
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
  /** The slide's element id, so a link can land on it (`/work#slug`, the project page's way back). */
  anchor?: string | null | undefined;
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
  dict: {
    play: string;
    playTitle: string;
    stop: string;
    failed: string;
    watchOnVimeo: string;
    view?: string | undefined;
  };
};

/**
 * One full-bleed project: the cover still, a preview loop behind it when the project has one, and
 * a play button that swaps the Vimeo player into the slide. Without a Vimeo URL it is just the cover.
 */
export function ProjectSlide({
  label,
  title,
  slug,
  meta,
  titleAttribute,
  role,
  href,
  as: Heading = "h2",
  anchor,
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
  const {
    playing,
    failed,
    loading,
    revealed,
    fullscreen,
    tapInPlayer,
    playFullscreenNatively,
    play,
    stop,
    setPlayerFrame,
    onScreen,
  } = usePlayback(root, {
    video,
    slug,
  });

  const showLoop = loop !== null && onScreen && !playing && !reducedMotion;

  return (
    <FullBleedSlide id={anchor ?? undefined} label={label} className={className}>
      {/* The whole frame (still, scrims, pills) is shared with the project page's hero, so opening a project carries
          it there as one piece; the title, meta and Play pill travel on their own above it. */}
      {/* A slide is cropped tighter than the hero (it is taller), so arriving here the hero's wider frame carries in. */}
      <Cut name={cutName.still(slug)} hold={Heading !== "h1"}>
        <div ref={root} tabIndex={-1} className="absolute inset-0 outline-none">
          <div className="absolute inset-0 bg-bg-raised">
            {image && (
              <ArtDirectedImage
                landscape={image}
                portrait={mobileImage}
                sizes="100vw"
                priority={priority}
                className="absolute inset-0 size-full"
              />
            )}
          </div>

          {showLoop && <PreviewLoop src={vimeoEmbedUrl(loop, { background: true })} title={title} />}

          {!playing && (
            // Keeps the white logo, filter pills and counter legible over bright covers.
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-scrim/55 to-transparent"
            />
          )}

          {playing && !fullscreen && (
            // Before the player in the DOM, so Tab goes from Stop into the player; z-10 keeps it above it.
            // Not while the slide is full screen: the video has the whole screen, and leaving full screen brings Stop back.
            // On phones the floating menu button sits in the top corner, so Stop goes beneath it.
            // The soft black behind the pill brings its label to 4.5:1 over a white frame (the glass alone dims to 0.88).
            <div className="absolute top-[calc(max(1.25rem,env(safe-area-inset-top))+4rem)] right-4 z-10 rounded-full bg-scrim/55 shadow-[0_0_1.5rem_0.5rem_rgb(0_0_0/0.4)] md:top-6 md:right-6">
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
              slug={slug}
              title={title}
              titleAttribute={titleAttribute}
              meta={meta}
              role={role}
              href={href}
              dict={dict}
              onPlay={video ? play : undefined}
            />
          )}

          {loading && (
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center bg-scrim/30">
              <div className="size-10 animate-spin rounded-full border-2 border-on-image/25 border-t-on-image motion-reduce:animate-none" />
            </div>
          )}

          {failed && video && <FilmFailed video={video} dict={dict} />}
        </div>
      </Cut>
    </FullBleedSlide>
  );
}

type SlideCaptionProps = Pick<ProjectSlideProps, "slug" | "title" | "meta" | "titleAttribute" | "role" | "href" | "dict"> & {
  Heading: "h1" | "h2";
  /** Set when the project has a video; the Play pill appears with it. */
  onPlay: (() => void) | undefined;
};

/** The title, meta line and role over the cover, with the "view" and Play pills beside them. */
function SlideCaption({ Heading, slug, title, titleAttribute, meta, role, href, dict, onPlay }: SlideCaptionProps) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-scrim/75 via-scrim/30 to-transparent px-5 pt-32 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-10",
        href && "max-sm:flex-col max-sm:items-start",
      )}
    >
      <div className="min-w-0">
        <Cut name={cutName.title(slug)} text hold={Heading !== "h1"}>
          <Heading data-sanity={titleAttribute} className="font-display text-4xl text-balance italic md:text-7xl">
            {href ? (
              <Link href={href} prefetch className="hover:underline focus-visible:underline">
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>
        </Cut>
        {/* Travels with the title, so the caption moves as one line rather than fading in under it. */}
        <Cut name={cutName.meta(slug)} text hold={Heading !== "h1"}>
          <p className="mt-1 text-sm text-on-image md:text-base">{meta}</p>
        </Cut>
        {role && <p className="mt-1 text-sm text-on-image/65">{role}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-3">
        {href && dict.view && (
          // `prefetch` loads the whole project ahead of the click, so the still can carry straight into its page.
          <GlassPillLink href={href} prefetch size="lg" onImage aria-label={`${dict.view}: ${title}`}>
            {dict.view}
          </GlassPillLink>
        )}
        {onPlay && (
          <Cut name={cutName.play(slug)}>
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
          </Cut>
        )}
      </div>
    </div>
  );
}

/** Over the still when the player never loaded its film. If the film loads after all, it goes away and the player shows through. */
function FilmFailed({ video, dict }: { video: VimeoRef; dict: Pick<ProjectSlideProps["dict"], "failed" | "watchOnVimeo"> }) {
  return (
    <div
      role="alert"
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-scrim/70 px-6 text-center text-on-image"
    >
      <p className="font-display text-2xl italic md:text-4xl">{dict.failed}</p>
      <GlassPillLink href={vimeoWatchUrl(video)} target="_blank" rel="noopener noreferrer" size="lg" onImage>
        {dict.watchOnVimeo}
        <span aria-hidden>→</span>
      </GlassPillLink>
    </div>
  );
}
