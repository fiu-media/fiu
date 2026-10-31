import { notFound } from "next/navigation";
import { railInset } from "@/components/nav/rail";
import { SiteNav } from "@/components/nav/SiteNav";
import { isLocale } from "@/lib/i18n/config";

/** Pages that follow the system light/dark setting (Rentals, Contact). */
export default async function AdaptiveLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="adaptive" className={`min-h-dvh bg-bg text-fg md:pt-[max(2.5rem,env(safe-area-inset-top))] ${railInset}`}>
      <SiteNav lang={lang} />
      {children}
    </div>
  );
}
