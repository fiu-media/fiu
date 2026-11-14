import "server-only";

import type { Locale } from "../config";
import type { Dictionary } from "./en";

// Strings may use ICU syntax (plural, select…) for `format()`; plain `{placeholder}` still works, and plural-sensitive callers pass `lang`.
// Adding a language: create `<lang>.ts` exporting a complete `Dictionary`, add it here and to `locales`. TypeScript
// checks it has every string English has, and no others.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en").then((m) => m.en),
  ga: () => import("./ga").then((m) => m.ga),
};

export const getDictionary = (lang: Locale) => dictionaries[lang]();
