import { type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";
import { skipHref } from "@/lib/skipLink";

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
    <>
      {/* First in the tab order on every page: past the rail (or the menu bar) to the page's <main>. */}
      <a href={skipHref} className="skip-link">
        {dict.nav.skip}
      </a>
      <SiteNavClient
        lang={lang}
        items={getNavItems(lang, dict)}
        homeHref={localizedPath(lang, "/")}
        labels={dict.nav}
        onImage={onImage}
        overFootage={overFootage}
      />
    </>
  );
}
