import { IntlMessageFormat } from "intl-messageformat";
import { defaultLocale, type Locale } from "./config";

type Values = Record<string, string | number>;

/** A `{name, type…}` argument means ICU (plural, select, number…); a bare `{name}` is plain substitution. */
const ICU_ARGUMENT = /\{\s*\w+\s*,/;

const compiled = new Map<string, IntlMessageFormat>();

/**
 * Fill placeholders in dictionary strings. Strings, not functions, so slices can cross into Client Components.
 *
 * A plain `{name}` is substituted directly; a string with ICU syntax (e.g. `{count, plural, one {…} other {…}}`)
 * is rendered with `intl-messageformat` for `lang`, so plural-sensitive copy needs `lang` (it defaults to English).
 * A message that can't be parsed or rendered is returned as written rather than throwing.
 */
export function format(template: string, values: Values, lang: Locale = defaultLocale): string {
  if (!ICU_ARGUMENT.test(template)) {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
  }

  try {
    const key = `${lang}\0${template}`;
    let message = compiled.get(key);
    if (!message) {
      message = new IntlMessageFormat(template, lang);
      compiled.set(key, message);
    }
    return String(message.format(values));
  } catch {
    return template;
  }
}
