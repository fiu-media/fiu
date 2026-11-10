import { type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";

import { SiteNavClient } from "./SiteNavClient";

/**
 * Site navigation: a slim rail on the left edge from `md`, a Menu button with a full-screen
 * overlay below it. Mount it inside a `[data-surface]` wrapper and give the content `railInset`.
 * `onImage` is for the cinematic surface, where the phone bar floats over photography. `overFootage` is for Home, whose
 * hero runs under the phone bar: a scrim fades down behind the logo and the Menu button.
 */
export async function SiteNav({
  lang,
  onImage,
  overFootage,
}: {
  lang: Locale;
  onImage?: boolean | undefined;
  overFootage?: boolean | undefined;
}) {
  const dict = await getDictionary(lang);
  return (
    <SiteNavClient
      lang={lang}
      items={getNavItems(lang, dict)}
      homeHref={localizedPath(lang, "/")}
      labels={dict.nav}
      onImage={onImage}
      overFootage={overFootage}
    />
  );
}
