import { z } from "zod";
import { locales } from "@/lib/i18n/config";

export const ENQUIRY_TYPES = ["Project", "Talent", "Rentals", "Other"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const isEnquiryType = (value: string | null): value is EnquiryType =>
  (ENQUIRY_TYPES as readonly string[]).includes(value ?? "");

// Conform turns empty inputs into `undefined`, so a missing required field must also say "required".
const text = (max: number) => z.string({ error: "required" }).trim().max(max);
const required = (max: number) => text(max).min(1, "required");
const optionalText = (max: number) => text(max).optional().default("");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.iso.date("invalid");

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

export const quoteSchema = z
  .object({
    ...common,
    name: required(120),
    email: z.email("invalid").max(200),
    phone: optionalText(40),
    company: optionalText(120),
    production: optionalText(160),
    startDate: isoDate,
    endDate: isoDate,
    message: optionalText(4000),
    items: basket,
  })
  .refine((v) => !ISO_DATE.test(v.startDate) || !ISO_DATE.test(v.endDate) || v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "beforeStart",
  });

export const contactSchema = z.object({
  ...common,
  name: required(120),
  email: z.email("invalid").max(200),
  enquiryType: z.enum(ENQUIRY_TYPES),
  message: required(4000),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
