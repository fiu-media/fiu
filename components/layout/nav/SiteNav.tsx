import { type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";

import { SiteNavClient } from "./SiteNavClient";

/**
 * Site navigation: a slim rail on the left edge from `md`, a Menu button with a full-screen
 * overlay below it. Mount it inside a `[data-surface]` wrapper and give the content `railInset`.
 * `onImage` is for the cinematic surface, where the phone bar floats over photography. `blurRail` frosts the rail's strip
 * (blur and tint, no fill); only the /dev sign-off page uses it, the site ships without.
 */
export async function SiteNav({ lang, onImage, blurRail }: { lang: Locale; onImage?: boolean; blurRail?: boolean }) {
  const dict = await getDictionary(lang);
  return (
    <SiteNavClient
      lang={lang}
      items={getNavItems(lang, dict)}
      homeHref={localizedPath(lang, "/")}
      labels={dict.nav}
      onImage={onImage}
      blurRail={blurRail}
    />
  );
}
