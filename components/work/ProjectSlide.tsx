"use client";

import { Play } from "lucide-react";
import Image, { getImageProps } from "next/image";
import { type CSSProperties, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FullBleedSlide } from "@/components/ui/FullBleedScroll";
import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { format } from "@/lib/i18n/format";
import { useReducedMotion } from "@/lib/reduced-motion";
import { parseVimeo, vimeoEmbedUrl } from "@/lib/vimeo";
import { useVimeoPlayer } from "./useVimeoPlayer";

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
  /** `data-sanity` value that makes the title clickable in the Presentation tool. */
  titleAttribute?: string;
  /** What this person did on the project (talent pages only). */
  role?: string;
  image: SlideImage | null;
  /** Portrait cover for portrait screens (phones). Without one, `image` is cropped to fit. */
  mobileImage?: SlideImage | null;
  vimeoUrl?: string | null;
  /** Short silent loop shown while the slide is on screen (a Vimeo background embed, which needs Vimeo Plus). */
  previewLoopUrl?: string | null;
  /** The first slide loads eagerly; the rest are lazy. */
  priority?: boolean;
  dict: { play: string; stop: string };
};

/** Mostly on screen: the preview loop runs. Mostly off: a playing video pauses. */
const ACTIVE_RATIO = 0.6;
const LEFT_RATIO = 0.25;
/** If the player never reports playback (autoplay blocked), show it anyway so its own play button is reachable. */
const REVEAL_FALLBACK_MS = 3000;

/**
 * The page is dark, so an iframe would inherit a dark color-scheme. Vimeo's player page is light, and when the
 * two differ Chrome and Safari paint an opaque white backdrop behind it: a white flash while it loads, and white
 * bars wherever the video doesn't fill the frame. Matching Vimeo's scheme keeps the frame transparent over black.
 */
const VIMEO_FRAME_STYLE = { colorScheme: "light" } as const;
/** Escape that ends fullscreen can reach the page as well; it shouldn't also stop the video. */
const FULLSCREEN_EXIT_GRACE_MS = 500;
/** How long after leaving fullscreen the window may still be animating back to size. */
const FULLSCREEN_SETTLE_MS = 1000;

/** The fullscreen element, including Safari's prefixed API. */
function fullscreenElement(): Element | null {
  return document.fullscreenElement ?? (document as { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ?? null;
}

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
  image,
  mobileImage,
  vimeoUrl,
  previewLoopUrl,
  priority,
  dict,
}: ProjectSlideProps) {
  const root = useRef<HTMLDivElement>(null);
  const [playerFrame, setPlayerFrame] = useState<HTMLIFrameElement | null>(null);
  const away = useRef(false);
  const [onScreen, setOnScreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  // The player stays invisible over the cover until it is actually playing, so its loading screen never shows.
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useReducedMotion();

  const video = parseVimeo(vimeoUrl);
  const loop = parseVimeo(previewLoopUrl);

  const play = useCallback(() => setPlaying(true), []);
  const reveal = useCallback(() => setRevealed(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setRevealed(false);
    // The player is gone; put keyboard focus back where it came from.
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>("[data-play]")?.focus());
  }, []);

  // A playing video pauses when its slide scrolls away, keeping its place, and stays mounted.
  const player = useVimeoPlayer(playerFrame, {
    // Not `play`: Vimeo fires that before the first frame, while its own spinner is still up.
    playing: reveal,
    ended: stop,
    // The SDK can load after the viewer has already left the slide.
    ready: (ready) => {
      if (away.current) ready.pause().catch(() => {});
    },
  });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.intersectionRatio >= ACTIVE_RATIO);
        away.current = entry.intersectionRatio < LEFT_RATIO;
        // The page can shift under a fullscreen video (see below); that isn't the viewer scrolling away.
        if (away.current && !fullscreenElement()) player.current?.pause().catch(() => {});
      },
      { threshold: [0, LEFT_RATIO, ACTIVE_RATIO] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [player]);

  const showLoop = loop !== null && onScreen && !playing && !reducedMotion;

  // Focus goes to Stop, not into the player: key presses inside Vimeo's cross-origin frame never reach the page,
  // so Escape couldn't stop the video. Tab moves on into the player's own controls.
  useEffect(() => {
    if (playing) root.current?.querySelector<HTMLButtonElement>("[data-stop]")?.focus();
  }, [playing]);

  useEffect(() => {
    if (!playing || !playerFrame) return;
    const slide = root.current?.closest("section");
    let fullscreen = false;
    let exitedAt = -Infinity;
    let settling: ReturnType<typeof setTimeout> | undefined;
    // Going fullscreen resizes the window, and the document's mandatory snapping can land on another slide (or the
    // top of the page) as it resizes back. Put this slide back, and keep doing so until the window has settled.
    const restore = () => slide?.scrollIntoView({ block: "start", behavior: "instant" });
    const stopRestoring = () => window.removeEventListener("resize", restore);

    const onFullscreenChange = () => {
      if (fullscreenElement() === playerFrame) {
        fullscreen = true;
        return;
      }
      if (!fullscreen) return;
      fullscreen = false;
      exitedAt = performance.now();
      restore();
      window.addEventListener("resize", restore);
      clearTimeout(settling);
      settling = setTimeout(stopRestoring, FULLSCREEN_SETTLE_MS);
      // Focus was inside the player; bring it back out so Escape works again.
      root.current?.querySelector<HTMLButtonElement>("[data-stop]")?.focus({ preventScroll: true });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || away.current) return;
      if (fullscreenElement() || performance.now() - exitedAt < FULLSCREEN_EXIT_GRACE_MS) return;
      stop();
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(settling);
      stopRestoring();
    };
  }, [playing, playerFrame, stop]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(reveal, REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [playing, reveal]);

  return (
    <FullBleedSlide label={label}>
      <div ref={root} className="absolute inset-0">
        {image ? (
          <Cover image={image} mobileImage={mobileImage} priority={priority} />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-bg-raised" />
        )}

        {showLoop && loop && <PreviewLoop src={vimeoEmbedUrl(loop, { background: true })} />}

        {!playing && (
          // Keeps the white logo, filter pills and counter legible over bright covers.
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/45 to-transparent"
          />
        )}

        {playing && (
          // Before the player in the DOM, so Tab goes from Stop into the player; z-10 keeps it above it.
          <div className="absolute top-4 right-4 z-10 md:top-6 md:right-6">
            <GlassPillButton data-stop size="md" onImage onClick={stop}>
              {dict.stop}
            </GlassPillButton>
          </div>
        )}

        {playing && video ? (
          <iframe
            ref={setPlayerFrame}
            src={vimeoEmbedUrl(video, { autoplay: true })}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={VIMEO_FRAME_STYLE}
            className={cn(
              "absolute inset-0 size-full border-0 bg-black transition-opacity duration-500 motion-reduce:transition-none",
              revealed ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-5 pt-32 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-10">
            <div className="min-w-0">
              <h2 data-sanity={titleAttribute} className="font-display text-4xl text-balance italic md:text-7xl">
                {title}
              </h2>
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
                <Play aria-hidden fill="currentColor" className="size-4" />
                <span className="max-sm:sr-only">{dict.play.replace(/\s*\{title\}/, "")}</span>
              </GlassPillButton>
            )}
          </div>
        )}

        {playing && !revealed && (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30">
            <div className="size-10 animate-spin rounded-full border-2 border-white/25 border-t-white motion-reduce:animate-none" />
          </div>
        )}
      </div>
    </FullBleedSlide>
  );
}

const PORTRAIT = "(orientation: portrait)";

function subscribeToPortrait(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The cover still, full-bleed. With a mobile cover, a `<picture>` lets the browser fetch only the one
 * that fits the screen's orientation; the hotspot and blur placeholder follow it through CSS variables,
 * and the alt text follows it once the client knows the orientation (the server assumes landscape).
 */
function Cover({ image, mobileImage, priority }: { image: SlideImage; mobileImage?: SlideImage | null; priority?: boolean }) {
  const portrait = useSyncExternalStore(
    subscribeToPortrait,
    () => window.matchMedia(PORTRAIT).matches,
    () => false,
  );

  if (!mobileImage) {
    return (
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
    );
  }

  // Not `preload`: a preload link can't say which of the two sources the screen will pick.
  const eager = priority ? ({ loading: "eager", fetchPriority: "high" } as const) : {};
  const props = (still: SlideImage) =>
    getImageProps({ src: still.src, width: still.width, height: still.height, alt: still.alt, sizes: "100vw", ...eager }).props;
  const desktop = props(image);
  const mobile = props(mobileImage);
  const blur = (still: SlideImage) => (still.blurDataURL ? `url("${still.blurDataURL}")` : "none");
  const vars = {
    "--cover-position": image.position ?? "50% 50%",
    "--cover-position-mobile": mobileImage.position ?? "50% 50%",
    "--cover-blur": blur(image),
    "--cover-blur-mobile": blur(mobileImage),
  } as CSSProperties;

  return (
    <picture>
      <source media={PORTRAIT} srcSet={mobile.srcSet} sizes={mobile.sizes} width={mobile.width} height={mobile.height} />
      <img
        {...desktop}
        alt={portrait ? mobileImage.alt : image.alt}
        style={{ ...desktop.style, ...vars }}
        className="absolute inset-0 size-full [background-image:var(--cover-blur)] bg-cover bg-center object-cover [object-position:var(--cover-position)] portrait:[background-image:var(--cover-blur-mobile)] portrait:[object-position:var(--cover-position-mobile)]"
      />
    </picture>
  );
}

/**
 * The muted loop behind the title. Mounted only while its slide is on screen, so it fades in again each time.
 * It fades in once the player reports playback rather than on the iframe's load, which fires before the
 * first frame and would show black.
 */
function PreviewLoop({ src }: { src: string }) {
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  useVimeoPlayer(frame, { play: () => setReady(true), bufferend: () => setReady(true) });
  return (
    <iframe
      ref={setFrame}
      src={src}
      title=""
      aria-hidden
      tabIndex={-1}
      loading="lazy"
      style={VIMEO_FRAME_STYLE}
      className={cn(
        "pointer-events-none absolute inset-0 size-full border-0 transition-opacity duration-700 motion-reduce:transition-none",
        ready ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
