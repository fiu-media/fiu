import { notFound } from "next/navigation";
import { GlassNav } from "@/components/nav/GlassNav";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";

/** Pages that follow the system light/dark setting (Rentals, Contact). */
export default async function AdaptiveLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <div data-surface="adaptive" className="min-h-dvh bg-bg text-fg">
      <header className="flex justify-center p-4 md:justify-end md:p-6">
        <GlassNav items={getNavItems(lang, dict)} label={dict.nav.label} />
      </header>
      {children}
    </div>
  );
}
