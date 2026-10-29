import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { isLocale } from "@/lib/i18n/config";

export const viewport: Viewport = { themeColor: "#0c0b0d" };

/** Pages that are always dark (About, Our Work, Talent). The header floats over the content. */
export default async function CinematicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="cinematic" className="relative isolate min-h-dvh bg-ink text-fg">
      <div className="absolute inset-x-0 top-0 z-20">
        <SiteHeader lang={lang} onImage />
      </div>
      {children}
    </div>
  );
}
