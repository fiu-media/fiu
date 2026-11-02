import { z } from "zod";
import { isValidRange } from "@/lib/dates";
import { locales } from "@/lib/i18n/config";

export const ENQUIRY_TYPES = ["Project", "Talent", "Rentals", "Other"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const isEnquiryType = (value: string | null): value is EnquiryType =>
  (ENQUIRY_TYPES as readonly string[]).includes(value ?? "");

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1, "required");
const optionalText = (max: number) => text(max).optional().default("");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.iso.date("invalid");

// `website` is the honeypot: real visitors never see or fill it.
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
    items: z
      .array(z.object({ itemId: z.string().min(1).max(200), qty: z.number().int().min(1).max(99) }))
      .min(1, "empty")
      .max(100),
  })
  .refine((v) => !ISO_DATE.test(v.startDate) || !ISO_DATE.test(v.endDate) || isValidRange(v.startDate, v.endDate), {
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
