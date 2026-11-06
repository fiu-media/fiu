"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

/**
 * not-found.tsx gets no params, so the language comes from the URL, as NotFoundBackLink does for the section:
 * `/ga/talent/unknown` is Irish, and an unprefixed URL is the default language. The server renders the 404 in
 * every language and only the one that matches the URL is mounted.
 */
export function LocalizedNotFound({ pages }: { pages: Record<Locale, ReactNode> }) {
  const first = usePathname().split("/").find(Boolean);
  return pages[first && isLocale(first) ? first : defaultLocale];
}
