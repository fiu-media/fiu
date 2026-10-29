import { localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";
import { SiteNavClient } from "./SiteNavClient";

/**
 * Site navigation: a slim rail on the left edge from `md`, a Menu button with a full-screen
 * overlay below it. Mount it inside a `[data-surface]` wrapper and give the content `railInset`.
 * `onImage` is for the cinematic surface, where the phone bar floats over photography.
 */
export async function SiteNav({ lang, onImage }: { lang: Locale; onImage?: boolean }) {
  const dict = await getDictionary(lang);
  return (
    <SiteNavClient
      items={getNavItems(lang, dict)}
      homeHref={localizedPath(lang, "/")}
      labels={dict.nav}
      onImage={onImage}
    />
  );
}
