import type { Viewport } from "next";
import { LocalizedNotFound } from "@/components/LocalizedNotFound";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ThemeColor } from "@/components/ThemeColor";

const INK = "#0c0b0d";

// The 404 is always dark, so the browser bars are too. `viewport` covers an unknown URL, whose head is the 404's own;
// ThemeColor covers a 404 that streams in under a route that already sent its colours (/rentals/unknown).
export const viewport: Viewport = { themeColor: INK };

// not-found.tsx gets no params, so every language is rendered and LocalizedNotFound mounts the one the URL is in.
// Compare the other layouts at /dev/not-found.
export default function NotFound() {
  return (
    <>
      <ThemeColor color={INK} />
      {/* Typed as Record<Locale, …>, so a new language can't be added without its 404. */}
      <LocalizedNotFound pages={{ en: <NotFoundPage lang="en" />, ga: <NotFoundPage lang="ga" /> }} />
    </>
  );
}
