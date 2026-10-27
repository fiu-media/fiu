import { notFound } from "next/navigation";
import { GlassNav } from "@/components/nav/GlassNav";
import { HomeLink } from "@/components/nav/HomeLink";
import { isLocale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";

/** Pages that follow the system light/dark setting (Rentals, Contact). */
export default async function AdaptiveLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <div data-surface="adaptive" className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-4 md:flex-row md:justify-between md:px-6 md:py-6">
        <div className="order-2 md:order-1">
          <HomeLink href={localizedPath(lang, "/")} label={dict.nav.home} />
        </div>
        <div className="order-1 md:order-2">
          <GlassNav items={getNavItems(lang, dict)} label={dict.nav.label} />
        </div>
      </header>
      {children}
    </div>
  );
}
