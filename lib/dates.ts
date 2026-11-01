// Relative imports: the email templates import this file and run outside the `@/` alias (react-email dev).
import { dateLocale, type Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries/en";
import { format } from "./i18n/format";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** Parse a `YYYY-MM-DD` calendar date as UTC midnight, or `null` if it isn't a real date. */
function parseIso(value: string): number | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const time = Date.UTC(Number(y), Number(m) - 1, Number(d));
  return new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

/** Today's calendar date in Dublin (`YYYY-MM-DD`), whatever timezone the server runs in. */
export const todayInDublin = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(now);

/** True when both are real ISO dates and `end` is on or after `start`. */
export function isValidRange(start: string, end: string): boolean {
  const from = parseIso(start);
  const to = parseIso(end);
  return from !== null && to !== null && to >= from;
}

/** Days in the hire, counting both the pick-up and return day (same day = 1). */
export function rentalDays(start: string, end: string): number {
  const from = parseIso(start);
  const to = parseIso(end);
  if (from === null || to === null) return 0;
  return Math.round((to - from) / DAY_MS) + 1;
}

/** A localised range such as "3–5 Nov 2026". Calendar dates, so formatted in UTC to avoid any shift. */
export function formatDateRange(start: string, end: string, locale: string): string {
  const from = parseIso(start);
  const to = parseIso(end);
  if (from === null || to === null) return `${start} – ${end}`;
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return formatter.formatRange(from, to);
}

/** "3–5 Nov 2026 · 3 days": the localised range with its length, for the form and the quote emails. */
export function describeRange(dates: Dictionary["dates"], lang: Locale, start: string, end: string): string {
  const days = rentalDays(start, end);
  return format(dates.rangeSummary, {
    range: formatDateRange(start, end, dateLocale[lang]),
    duration: format(days === 1 ? dates.dayOne : dates.dayMany, { count: days }),
  });
}
