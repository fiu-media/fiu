import { getCountries, type CountryCode } from "libphonenumber-js/min";
import type { Locale } from "@/lib/i18n/config";

/**
 * Irish country names lead with the article, and it changes the next letter ("an Fhrainc", "an tSín",
 * "na hOileáin Fhilipíneacha"), so sorting by the whole name puts nearly everything under A and N.
 * Strip the article and the t / h it brings, to sort by the name itself.
 */
const LEADING_ARTICLE = /^(?:[Aa]n|[Nn]a) (?:t(?=S)|h(?=[AEIOUÁÉÍÓÚ]))?/;

/** Capitalise the first letter, for names the locale writes in lower case ("an Fhrainc"). */
const capitalise = (name: string, lang: Locale) => name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);

export type CountryName = { code: CountryCode; name: string };

/**
 * Every country libphonenumber knows, named and sorted for `lang`. Call it on the server and pass the list to the
 * form: browsers differ in which languages they have region names for (some Chromium builds have no Irish and
 * answer in English), and a list built in the browser would then not match the server's.
 */
export function countryNames(lang: Locale): CountryName[] {
  const names = new Intl.DisplayNames([lang], { type: "region" });
  const sortKey = (name: string) => (lang === "ga" ? name.replace(LEADING_ARTICLE, "") : name);
  return getCountries()
    .map((code) => ({ code, name: capitalise(names.of(code) ?? code, lang) }))
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), lang));
}
