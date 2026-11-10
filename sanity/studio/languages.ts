import { localeNames, locales } from "../../lib/i18n/config";

export { translatedTypes } from "../schema/documentTypes";

/** Studio languages, derived from the site's locales so the two can't drift. */
export const languages = locales.map((id) => ({ id, title: localeNames[id] }));
