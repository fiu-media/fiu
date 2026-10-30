import { localizedPath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

export type NavItem = { href: string; label: string };

export function getNavItems(lang: Locale, { nav }: Dictionary): NavItem[] {
  return [
    { href: localizedPath(lang, "/about"), label: nav.about },
    { href: localizedPath(lang, "/work"), label: nav.work },
    { href: localizedPath(lang, "/talent"), label: nav.talent },
    { href: localizedPath(lang, "/rentals"), label: nav.rentals },
    { href: localizedPath(lang, "/contact"), label: nav.contact },
  ];
}
