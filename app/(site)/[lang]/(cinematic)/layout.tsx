import { notFound } from "next/navigation";

import { railInset } from "@/components/layout/nav/rail";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import { SiteFooter } from "@/features/site";
import { cn } from "@/lib/cn";
import { isLocale } from "@/lib/i18n/config";
import { cinematicViewport } from "@/lib/theme";

export const viewport = cinematicViewport;

/** Pages that are always dark (About, Our Work, Talent). The rail sits beside the content; on phones the menu bar floats over it. */
export default async function CinematicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="cinematic" className={cn("relative isolate min-h-dvh bg-ink text-fg", railInset)}>
      <SiteNav lang={lang} onImage />
      {children}
      <SiteFooter lang={lang} />
    </div>
  );
}
