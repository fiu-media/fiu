import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { isLocale } from "@/lib/i18n/config";

/** Pages that follow the system light/dark setting (Rentals, Contact). */
export default async function AdaptiveLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="adaptive" className="min-h-dvh bg-bg text-fg">
      <SiteHeader lang={lang} />
      {children}
    </div>
  );
}
