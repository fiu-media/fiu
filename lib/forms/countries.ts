import "server-only";

import { type CountryCode, getCountries } from "libphonenumber-js/min";

import { dateLocale, type Locale } from "@/lib/i18n/config";

export type CountryOption = { code: CountryCode; name: string };
export type CountryList = { pinned: CountryOption[]; all: CountryOption[] };

/** Listed first: where the studio is, and where most visitors will be calling from. */
const PINNED: CountryCode[] = ["IE", "GB", "US"];

/**
 * The phone field's country list, named and ordered in `lang`. It is built here, on the server, from Node's ICU data:
 * browsers differ (Chromium has no Irish region names at all, and sorts differently from Node), so the page sends the
 * finished list and the browser renders it as it is, which also keeps hydration in agreement.
 */
export function countryList(lang: Locale): CountryList {
  const tag = dateLocale[lang];
  const names = new Intl.DisplayNames([tag], { type: "region" });
  // Irish names are filed without their article: "an Fhrainc" sorts under F.
  const sortKey = (name: string) => (lang === "ga" ? name.replace(/^(an|na) /i, "") : name);
  const named = getCountries()
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), tag));
  return {
    pinned: PINNED.map((code) => named.find((c) => c.code === code)!),
    all: named.filter((c) => !PINNED.includes(c.code)),
  };
}
