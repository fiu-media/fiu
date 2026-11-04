import { localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";
import { SiteNavClient } from "./SiteNavClient";

/**
 * Site navigation: a slim rail on the left edge from `md`, a Menu button with a full-screen
 * overlay below it. Mount it inside a `[data-surface]` wrapper and give the content `railInset`.
 * `onImage` is for a page that is photography throughout (Home); `photoTopPaths` for pages that only open on a photo.
 */
export async function SiteNav({ lang, onImage, photoTopPaths }: { lang: Locale; onImage?: boolean; photoTopPaths?: string[] }) {
  const dict = await getDictionary(lang);
  return (
    <SiteNavClient
      items={getNavItems(lang, dict)}
      homeHref={localizedPath(lang, "/")}
      labels={dict.nav}
      onImage={onImage}
      photoTopPaths={photoTopPaths}
    />
  );
}
