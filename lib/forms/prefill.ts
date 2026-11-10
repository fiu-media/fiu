/**
 * Deep links into the forms: what a URL can prefill, how it is read, and how links are built.
 *
 *   /contact?type=Talent
 *   /rentals/quote?pickup=2026-12-01&return=2026-12-03&company=Murphy+Pictures&production=Spring+shoot&item=arri-skypanel-s60-c:2
 *
 * Only what isn't personal can be prefilled. Name, email, phone and message are never read from a URL, because
 * URLs are kept in server logs and analytics, browser history, and sent in the Referer header to other sites.
 * A value that doesn't pass the same rules the form enforces (a date in the past, an unknown item, a
 * number that isn't a number) is dropped rather than shown as an error the visitor didn't cause.
 */
import { clampQty } from "@/features/rentals/basket/quantity";
import { isIsoDate, isValidRange, rentalDays } from "@/lib/dates";
import type { Locale } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";

import { ENQUIRY_TYPES, type EnquiryType, isEnquiryType, limits, MAX_HIRE_DAYS, MAX_LEAD_DAYS } from "./schemas";

/** Most `item` parameters read from one link. */
export const MAX_ITEM_PARAMS = 20;

type Params = Pick<URLSearchParams, "get" | "getAll">;

/** Trimmed, with control characters (newlines and the like) removed and cut to `max`; `undefined` if nothing is left. */
function cleanText(value: string | null, max: number) {
  const text = (value ?? "")
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, max);
  return text === "" ? undefined : text;
}

/**
 * The part of a query string that makes a link a prefill, for deciding whether the form should start over. `names`
 * are the parameters the form reads; the rest (tracking tags, `?lang=`…) don't count.
 */
export function prefillKey(params: Iterable<[string, string]>, names: readonly string[]) {
  return new URLSearchParams([...params].filter(([name]) => names.includes(name))).toString();
}

// --- Contact ---

export const CONTACT_PARAMS = ["type"] as const;

/** Enquiry type (the first, if the link names none or an unknown one). */
export function contactPrefill(params: Params) {
  const requested = params.get("type");
  return { enquiryType: isEnquiryType(requested) ? requested : ENQUIRY_TYPES[0] };
}

// --- Quote ---

export const QUOTE_PARAMS = ["pickup", "return", "company", "production", "item"] as const;

type CatalogueEntry = { id: string; slug: string; max: number };

export type QuotePrefill = {
  start?: string | undefined;
  end?: string | undefined;
  company?: string | undefined;
  production?: string | undefined;
  items: { itemId: string; qty: number; max: number }[];
};

/**
 * What a quote link asks for. Dates are only taken if they could be submitted: real, not in the past, not further
 * ahead than the form allows, and a return no earlier than the pick-up. Items are named by slug (and optionally
 * a quantity, `slug:2`) and must be in the catalogue, which only lists what can be requested.
 */
export function quotePrefill(params: Params, catalogue: Record<string, CatalogueEntry>, today: string): QuotePrefill {
  const requestedStart = params.get("pickup");
  const requestedEnd = params.get("return");
  const start =
    isIsoDate(requestedStart) && requestedStart >= today && rentalDays(today, requestedStart) <= MAX_LEAD_DAYS
      ? requestedStart
      : undefined;
  const endOk =
    isIsoDate(requestedEnd)
    && requestedEnd >= today
    && (start ? isValidRange(start, requestedEnd) && rentalDays(start, requestedEnd) <= MAX_HIRE_DAYS : true);
  const end = endOk ? requestedEnd! : undefined;

  const bySlug = new Map(Object.values(catalogue).map((entry) => [entry.slug, entry]));
  const items = new Map<string, QuotePrefill["items"][number]>();
  for (const raw of params.getAll("item").slice(0, MAX_ITEM_PARAMS)) {
    const [slug, quantity] = raw.split(":", 2);
    const entry = bySlug.get(slug ?? "");
    if (!entry || items.has(entry.id)) continue;
    const asked = quantity !== undefined && /^\d+$/.test(quantity) ? Number(quantity) : 1;
    items.set(entry.id, { itemId: entry.id, qty: clampQty(asked, entry.max), max: entry.max });
  }

  return {
    start,
    end,
    company: cleanText(params.get("company"), limits.company),
    production: cleanText(params.get("production"), limits.production),
    items: [...items.values()],
  };
}

// --- Links ---

const withQuery = (path: string, query: URLSearchParams) => (query.size > 0 ? `${path}?${query}` : path);

/** A link to the contact form. */
export function contactHref(lang: Locale, { type }: { type?: EnquiryType } = {}) {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  return withQuery(href(lang, routes.contact()), query);
}

/** A link to the quote form. Items are catalogue slugs with a quantity; a quantity of 1 is left implied. */
export function quoteHref(
  lang: Locale,
  {
    start,
    end,
    company,
    production,
    items = [],
  }: {
    start?: string | undefined;
    end?: string | undefined;
    company?: string | undefined;
    production?: string | undefined;
    items?: { slug: string; qty: number }[];
  } = {},
) {
  const query = new URLSearchParams();
  if (start) query.set("pickup", start);
  if (end) query.set("return", end);
  if (company) query.set("company", company);
  if (production) query.set("production", production);
  for (const { slug, qty } of items) query.append("item", qty > 1 ? `${slug}:${qty}` : slug);
  return withQuery(href(lang, routes.quote()), query);
}
