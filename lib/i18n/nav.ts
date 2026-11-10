import { features } from "../features";
import { href, routes } from "../routes";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

export type NavItem = { href: string; label: string };

export function getNavItems(lang: Locale, { nav }: Dictionary): NavItem[] {
  return [
    { href: href(lang, routes.about()), label: nav.about },
    { href: href(lang, routes.work()), label: nav.work },
    { href: href(lang, routes.talent()), label: nav.talent },
    ...(features.rentals ? [{ href: href(lang, routes.rentals()), label: nav.rentals }] : []),
    { href: href(lang, routes.contact()), label: nav.contact },
  ];
}
