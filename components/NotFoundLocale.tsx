"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

/** The locale of a public pathname: its first segment if that is a language, else the default (`/unknown` is English). */
export function localeOfPath(pathname: string): Locale {
  const first = pathname.split("/").find(Boolean);
  return first && isLocale(first) ? first : defaultLocale;
}

/**
 * not-found.tsx gets no params, so it can't tell which language the missing URL was in. It renders the 404 once per
 * language, and this shows the one the URL asks for, so the switcher and nav on the 404 follow the language too.
 */
export function NotFoundLocale({ pages }: { pages: Record<Locale, ReactNode> }) {
  return (
    <Suspense fallback={pages[defaultLocale]}>
      <ByPathname pages={pages} />
    </Suspense>
  );
}

function ByPathname({ pages }: { pages: Record<Locale, ReactNode> }) {
  return pages[localeOfPath(usePathname())];
}
