// Pure, so the browser's phone field and its tests share it. See components/forms/PhoneField.tsx.
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export const callingCode = (country: CountryCode) => getCountryCallingCode(country);
export const digitsIn = (text: string) => text.replace(/\D/g, "").length;

/** Irish numbers set the first group, the mobile prefix or the area code, in brackets: "83 123 4567" → "(83) 123 4567". */
const bracketAreaCode = (country: CountryCode, formatted: string) =>
  country === "IE" ? formatted.replace(/^(\d{1,3}) /, "($1) ") : formatted;

/** A number written in international form, as the input shows it: "+353 83 123 4567" → "(83) 123 4567". */
function formatNational(country: CountryCode, national: string) {
  const prefix = `+${callingCode(country)}`;
  return bracketAreaCode(country, new AsYouType(country).input(`${prefix}${national}`).slice(prefix.length).trim());
}

/** A stored E.164 number as people write it, with its dialling code: "+353831234567" → "+353 (83) 123 4567". Anything unreadable comes back as it was. */
export function formatPhone(value: string) {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed?.country) return value;
  return `+${parsed.countryCallingCode} ${formatNational(parsed.country, parsed.nationalNumber)}`;
}

/**
 * Reads whatever was typed or pasted, however an Irish number is written — "083 123 4567" (with the trunk 0),
 * "83 123 4567", "+353 83 123 4567", "00353 83 123 4567" — and returns the same thing for all of them: the
 * national number, the country (an international number can belong to a different one than was selected),
 * the E.164 value, and the text to show, which has neither the 0 nor the code because the field shows the code itself.
 */
export function interpret(text: string, selected: CountryCode) {
  const typed = new AsYouType(selected);
  typed.input(text);
  const dialled = typed.getCallingCode();
  const country: CountryCode =
    dialled && dialled !== callingCode(selected)
      ? (typed.getCountry() ?? getCountries().find((c) => callingCode(c) === dialled) ?? selected)
      : selected;
  const national = typed.getNumber()?.nationalNumber ?? "";
  // "+" or "00" with no code complete yet: the visitor is still typing the country; leave it alone.
  const awaitingCode = /^\s*(\+|00)/.test(text) && !dialled;
  const shown = awaitingCode ? text.trim() : national ? formatNational(country, national) : /^\s*0\s*$/.test(text) ? "0" : "";
  return { country, shown, e164: national ? `+${callingCode(country)}${national}` : "" };
}

/** Where to put the caret so the same number of digits sit after it, whatever the reformatting did before it. */
export function caretWithDigitsAfter(shown: string, digitsAfter: number) {
  let seen = 0;
  for (let i = shown.length; i > 0; i--) {
    if (seen === digitsAfter) return i;
    if (/\d/.test(shown[i - 1])) seen++;
  }
  return seen === digitsAfter ? 0 : shown.length;
}

export function initial(defaultValue: string, fallback: CountryCode) {
  const parsed = defaultValue ? parsePhoneNumberFromString(defaultValue) : undefined;
  if (!parsed?.country) return { country: fallback, text: "" };
  return { country: parsed.country, text: formatNational(parsed.country, parsed.nationalNumber) };
}
