import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { railInset } from "@/components/nav/rail";
import { SiteNav } from "@/components/nav/SiteNav";
import { isLocale } from "@/lib/i18n/config";

export const viewport: Viewport = { themeColor: "#0c0b0d" };

/** Pages that are always dark (About, Our Work, Talent). The rail sits beside the content; on phones the menu bar floats over it. */
export default async function CinematicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="cinematic" className={`relative isolate min-h-dvh bg-ink text-fg ${railInset}`}>
      <SiteNav lang={lang} onImage />
      {children}
    </div>
  );
}
