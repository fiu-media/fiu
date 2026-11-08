import { notFound } from "next/navigation";

import { pageTop, railInset } from "@/components/layout/nav/rail";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import { SiteFooter } from "@/features/site";
import { cn } from "@/lib/cn";
import { isLocale } from "@/lib/i18n/config";

/** Pages with the plain page background rather than full-bleed imagery (Rentals, Contact). */
export default async function AdaptiveLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="adaptive" className={cn("min-h-dvh bg-bg text-fg", pageTop, railInset)}>
      <SiteNav lang={lang} />
      {children}
      <SiteFooter lang={lang} />
    </div>
  );
}
