"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FullBleedSlide } from "@/components/ui/FullBleedScroll";
import { GlassPillButton } from "@/components/ui/Glass";
import { format } from "@/lib/i18n/format";
import { parseVimeo, vimeoEmbedUrl } from "@/lib/vimeo";

export type SlideImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL?: string;
  /** CSS object-position from the editor's hotspot. */
  position?: string;
};

export type ProjectSlideProps = {
  /** Accessible name for the slide, e.g. "Solas, 2 of 5". */
  label: string;
  title: string;
  /** One line under the title: type, year, client. */
  meta: string;
  /** What this person did on the project (talent pages only). */
  role?: string;
  image: SlideImage | null;
  vimeoUrl?: string | null;
  /** Short silent loop shown while the slide is on screen (a Vimeo background embed, which needs Vimeo Plus). */
  previewLoopUrl?: string | null;
  /** The first slide loads eagerly; the rest are lazy. */
  priority?: boolean;
  dict: { play: string; stop: string };
};

/** Mostly on screen: the preview loop runs. Mostly off: a playing video stops. */
const ACTIVE_RATIO = 0.6;
const LEFT_RATIO = 0.25;

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

/**
 * One full-bleed project: the cover still, a preview loop behind it when the project has one, and
 * a play button that swaps the Vimeo player into the slide. Without a Vimeo URL it is just the cover.
 */
export function ProjectSlide({
  label,
  title,
  meta,
  role,
  image,
  vimeoUrl,
  previewLoopUrl,
  priority,
  dict,
}: ProjectSlideProps) {
  const root = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLIFrameElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const video = parseVimeo(vimeoUrl);
  const loop = parseVimeo(previewLoopUrl);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.intersectionRatio >= ACTIVE_RATIO);
        if (entry.intersectionRatio < LEFT_RATIO) setPlaying(false);
      },
      { threshold: [0, LEFT_RATIO, ACTIVE_RATIO] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showLoop = loop !== null && onScreen && !playing && !reducedMotion;

  const play = useCallback(() => setPlaying(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    // The player is gone; put keyboard focus back where it came from.
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>("[data-play]")?.focus());
  }, []);
  useEffect(() => {
    if (playing) player.current?.focus();
  }, [playing]);

  return (
    <FullBleedSlide label={label}>
      <div ref={root} className="absolute inset-0">
        {image ? (
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={image.alt}
            sizes="100vw"
            priority={priority}
            placeholder={image.blurDataURL ? "blur" : "empty"}
            blurDataURL={image.blurDataURL}
            style={{ objectPosition: image.position }}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-bg-raised" />
        )}

        {showLoop && loop && <PreviewLoop src={vimeoEmbedUrl(loop, { background: true })} />}

        {playing && video ? (
          <iframe
            ref={player}
            src={vimeoEmbedUrl(video, { autoplay: true })}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0 bg-black"
          />
        ) : (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-5 pt-32 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-10">
            <div className="min-w-0">
              <h2 className="font-display text-4xl text-balance italic md:text-7xl">{title}</h2>
              <p className="mt-1 text-sm text-white/80 md:text-base">{meta}</p>
              {role && <p className="mt-1 text-sm text-white/65">{role}</p>}
            </div>
            {video && (
              <GlassPillButton
                data-play
                size="lg"
                onImage
                onClick={play}
                aria-label={format(dict.play, { title })}
                className="shrink-0"
              >
                <PlayIcon />
                <span className="max-sm:sr-only">{dict.play.replace(/\s*\{title\}/, "")}</span>
              </GlassPillButton>
            )}
          </div>
        )}

        {playing && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <GlassPillButton size="md" onImage onClick={stop}>
              {dict.stop}
            </GlassPillButton>
          </div>
        )}
      </div>
    </FullBleedSlide>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/** The muted loop behind the title. Mounted only while its slide is on screen, so it fades in again each time. */
function PreviewLoop({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  return (
    <iframe
      src={src}
      title=""
      aria-hidden
      tabIndex={-1}
      loading="lazy"
      onLoad={() => setReady(true)}
      className={`pointer-events-none absolute inset-0 size-full border-0 transition-opacity duration-700 motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
