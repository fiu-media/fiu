import type { ReactNode } from "react";

import { NotFoundLocale } from "@/components/layout/NotFoundLocale";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { ThemeColor } from "@/components/layout/ThemeColor";
import { type Locale, locales } from "@/lib/i18n/config";
import { cinematicViewport, INK } from "@/lib/theme";

// The 404 is always dark, so the browser bars are too. `viewport` covers an unknown URL, whose head is the 404's own;
// ThemeColor covers a 404 that streams in under a route that already sent its colours (/rentals/unknown).
export const viewport = cinematicViewport;

// not-found.tsx gets no params, so every language's 404 is rendered and NotFoundLocale shows the one the URL is in.
// Compare the other layouts at /dev/not-found.
export default function NotFound() {
  const pages = Object.fromEntries(locales.map((lang) => [lang, <NotFoundPage key={lang} lang={lang} />])) as Record<
    Locale,
    ReactNode
  >;
  return (
    <>
      <ThemeColor color={INK} />
      <NotFoundLocale pages={pages} />
    </>
  );
}
