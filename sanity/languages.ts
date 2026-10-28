import { locales } from "../lib/i18n/config";

const titles = { en: "English" } satisfies Record<(typeof locales)[number], string>;

/** Studio languages, derived from the site's locales so the two can't drift. */
export const languages = locales.map((id) => ({ id, title: titles[id] }));

/** Document types with one document per language. Inbox types stay untranslated. */
export const translatedTypes = ["siteSettings", "project", "talent", "projectType", "role", "rentalCategory", "rentalItem"];
