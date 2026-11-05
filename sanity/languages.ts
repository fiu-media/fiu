import { localeNames, locales } from "../lib/i18n/config";

/** Studio languages, derived from the site's locales so the two can't drift. */
export const languages = locales.map((id) => ({ id, title: localeNames[id] }));

/** Document types with one document per language. Inbox types stay untranslated. */
export const translatedTypes = ["siteSettings", "project", "talent", "projectType", "role", "rentalCategory", "rentalItem"];
