"use client";

import { usePathname } from "next/navigation";
import { GlassPillLink } from "@/components/ui/Glass";
import { isLocale, localizedPath, type Locale } from "@/lib/i18n/config";
import type { NavItem } from "@/lib/i18n/nav";

/**
 * The 404's way out. Under a known section (`/talent/unknown`) it goes back to that section;
 * anywhere else it goes home. not-found.tsx gets no params, so the section comes from the URL.
 */
export function NotFoundBackLink({
  lang,
  home,
  backTo,
  sections,
}: {
  lang: Locale;
  home: string;
  /** "Back to {section}" */
  backTo: string;
  sections: NavItem[];
}) {
  const segments = usePathname().split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) segments.shift();
  const section = segments[0] ? sections.find((s) => s.href === localizedPath(lang, `/${segments[0]}`)) : undefined;

  return (
    <GlassPillLink href={section?.href ?? localizedPath(lang, "/")} size="lg" onImage>
      {section ? backTo.replace("{section}", section.label) : home}
    </GlassPillLink>
  );
}
