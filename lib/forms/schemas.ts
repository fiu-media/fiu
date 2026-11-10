import { isPossiblePhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js/min";
import { z } from "zod";

import { isIsoDate, isValidRange, rentalDays, todayInDublin } from "@/lib/dates";
import { isEmailAddress } from "@/lib/email/address";
import { locales } from "@/lib/i18n/config";

import { ENQUIRY_TYPES } from "./enquiry-types";

export { ENQUIRY_TYPES, type EnquiryType, isEnquiryType } from "./enquiry-types";

/** Longest value each text field accepts; the inputs carry the same limits, so a paste is cut off rather than rejected. */
export const limits = { name: 120, email: 200, company: 120, production: 160, message: 4000 } as const;

/** How far ahead a pick-up can be, and how long a hire can run. Longer than this is a conversation, not a form. */
export const MAX_LEAD_DAYS = 730;
export const MAX_HIRE_DAYS = 365;

// Conform turns empty inputs into `undefined`, so "required" means a missing value and nothing else:
// a too-long value must not borrow the same message.
const missing = (otherwise?: string) => (issue: { input?: unknown }) => (issue.input === undefined ? "required" : otherwise);

const text = (max: number) => z.string({ error: missing() }).trim().max(max, "tooLong");
const required = (max: number) => text(max).min(1, "required");
const optionalText = (max: number) => text(max).optional().default("");

// Accented letters and internationalised domains are fine (`séan@exämple.ie`); see lib/email/address.ts.
// Typed text can arrive decomposed (e + combining accent), so it is composed (NFC) before it is checked or stored.
const email = z
  .string({ error: missing("emailInvalid") })
  .trim()
  .transform((value) => value.normalize("NFC"))
  .pipe(z.string().max(limits.email, { error: "tooLong", abort: true }).refine(isEmailAddress, "emailInvalid"));

// An international number in E.164 form ("+353871234567"): the phone field's country select and number
// input are joined into that before they reach the form. Optional, but if it's there it has to be dialable.
const phone = z
  .string({ error: missing() })
  .trim()
  .optional()
  .default("")
  .refine((value) => value === "" || isPossiblePhoneNumber(value), "phoneInvalid")
  // Canonical E.164: "+353 0871234567" (a trunk 0 typed after the code) is stored as "+353871234567".
  .transform((value) => (value === "" ? value : (parsePhoneNumberFromString(value)?.number ?? value)));

const isoDate = z.iso.date({ error: missing("dateInvalid") });

const lines = z
  .array(z.object({ itemId: z.string().min(1).max(200), qty: z.number().int().min(1).max(99) }))
  .min(1, "empty")
  .max(100);

/**
 * The basket arrives as JSON in a hidden input; a missing one is an empty basket. Parsed in a transform
 * rather than a pipe because Conform's form parser would otherwise coerce the list's contents as form fields.
 */
const basket = z.string({ error: "empty" }).transform((value, ctx) => {
  let json: unknown = null;
  try {
    json = JSON.parse(value);
  } catch {}
  const parsed = lines.safeParse(json);
  if (parsed.success) return parsed.data;
  ctx.addIssue({ code: "custom", message: parsed.error.issues[0]?.message === "empty" ? "empty" : "invalid" });
  return z.NEVER;
});

// `website` is the honeypot: real visitors never see or fill it. `submissionId` is filled in by the
// browser after hydration, so a retry after a failure is recognised as the same request.
const common = {
  lang: z.enum(locales),
  submissionId: z.uuid(),
  website: z.string().default(""),
};

/** Fields the visitor can't see or edit; a problem with one is a problem with the submission, not a field. */
export const HIDDEN_FIELDS: readonly string[] = ["lang", "submissionId", "website"];

export const quoteSchema = z
  .object({
    ...common,
    name: required(limits.name),
    email,
    phone,
    company: optionalText(limits.company),
    production: optionalText(limits.production),
    startDate: isoDate,
    endDate: isoDate,
    message: optionalText(limits.message),
    items: basket,
  })
  .superRefine((value, ctx) => {
    const issue = (path: "startDate" | "endDate", message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    const startOk = isIsoDate(value.startDate);
    const endOk = isIsoDate(value.endDate);
    // Dates that aren't real dates already have their own error; don't pile a range error on top.
    if (startOk) {
      const today = todayInDublin();
      if (value.startDate < today) issue("startDate", "past");
      else if (rentalDays(today, value.startDate) > MAX_LEAD_DAYS) issue("startDate", "tooFar");
    }
    if (startOk && endOk) {
      if (!isValidRange(value.startDate, value.endDate)) issue("endDate", "beforeStart");
      else if (rentalDays(value.startDate, value.endDate) > MAX_HIRE_DAYS) issue("endDate", "hireTooLong");
    }
  });

export const contactSchema = z.object({
  ...common,
  name: required(limits.name),
  email,
  phone,
  enquiryType: z.enum(ENQUIRY_TYPES),
  message: required(limits.message),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
