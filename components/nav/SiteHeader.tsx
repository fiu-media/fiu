import { localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";
import { GlassNav } from "./GlassNav";
import { HomeLink } from "./HomeLink";

/**
 * Inner-page header: the small logo returns Home, the glass nav sits beside it.
 * `onImage` is for the cinematic surface, where the header floats over photography.
 */
export async function SiteHeader({ lang, onImage }: { lang: Locale; onImage?: boolean }) {
  const dict = await getDictionary(lang);
  return (
    <header className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-4 md:flex-row md:justify-between md:px-6 md:py-6">
      <div className="order-2 md:order-1">
        <HomeLink href={localizedPath(lang, "/")} label={dict.nav.home} />
      </div>
      <div className="order-1 md:order-2">
        <GlassNav items={getNavItems(lang, dict)} label={dict.nav.label} onImage={onImage} />
      </div>
    </header>
  );
}
