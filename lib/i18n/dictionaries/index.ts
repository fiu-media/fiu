import "server-only";
import type { Locale } from "../config";
import type { Dictionary } from "./en";

// Adding a language: create `<lang>.ts` exporting a `Dictionary`, add it here and to `locales`.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en").then((m) => m.en),
};

export const getDictionary = (lang: Locale) => dictionaries[lang]();
