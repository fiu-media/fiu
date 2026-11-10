export type VimeoRef = { id: string; hash?: string };

/**
 * The video id (and the privacy hash of an unlisted video) from the Vimeo URLs editors paste:
 * `vimeo.com/123`, `vimeo.com/123/abcdef`, `vimeo.com/channels/x/123` or `player.vimeo.com/video/123?h=abcdef`.
 */
export function parseVimeo(url: string | null | undefined): VimeoRef | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)vimeo\.com$/.test(parsed.hostname)) return null;
  const segments = parsed.pathname.split("/").filter(Boolean);
  const index = segments.findIndex((segment) => /^\d+$/.test(segment));
  const id = segments[index];
  if (id === undefined) return null;
  const hash = parsed.searchParams.get("h") ?? segments[index + 1]?.match(/^[0-9a-f]+$/i)?.[0];
  return { id, hash: hash || undefined };
}

type EmbedOptions = {
  autoplay?: boolean;
  background?: boolean;
  /** `false` plays full screen on iPhones, which can't put an embed full screen themselves (it is ignored elsewhere). */
  playsinline?: boolean;
};

/** `player.vimeo.com` embed URL. `background` is the controls-free, muted, looping preview (needs Vimeo Plus or higher). */
export function vimeoEmbedUrl({ id, hash }: VimeoRef, { autoplay, background, playsinline }: EmbedOptions = {}): string {
  const params = new URLSearchParams({ dnt: "1" });
  if (hash) params.set("h", hash);
  if (background) params.set("background", "1");
  else if (autoplay) params.set("autoplay", "1");
  if (playsinline === false) params.set("playsinline", "0");
  return `https://player.vimeo.com/video/${id}?${params}`;
}
