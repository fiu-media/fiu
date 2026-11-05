import type { Viewport } from "next";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ThemeColor } from "@/components/ThemeColor";
import { defaultLocale } from "@/lib/i18n/config";

const INK = "#0c0b0d";

// The 404 is always dark, so the browser bars are too. `viewport` covers an unknown URL, whose head is the 404's own;
// ThemeColor covers a 404 that streams in under a route that already sent its colours (/rentals/unknown).
export const viewport: Viewport = { themeColor: INK };

// not-found.tsx gets no params, so this renders in the default locale (the only one so far).
// Compare the other layouts at /dev/not-found.
export default function NotFound() {
  return (
    <>
      <ThemeColor color={INK} />
      <NotFoundPage lang={defaultLocale} />
    </>
  );
}
