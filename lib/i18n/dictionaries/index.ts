import "server-only";

import type { Locale } from "../config";
import type { Dictionary } from "./en";
import { deepMerge } from "./merge";

// Strings may use ICU syntax (plural, select…) for `format()`; plain `{placeholder}` still works, and plural-sensitive callers pass `lang`.
// Adding a language: create `<lang>.ts` exporting a `DeepPartial<Dictionary>`, add it here and to `locales`.
// Translations are merged over English, so a language can be filled in one string at a time.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en").then((m) => m.en),
  ga: async () => {
    const [{ en }, { ga }] = await Promise.all([import("./en"), import("./ga")]);
    return deepMerge<Dictionary>(en, ga);
  },
};

export const getDictionary = (lang: Locale) => dictionaries[lang]();
