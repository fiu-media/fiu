import "server-only";

import ContactConfirmation from "@/emails/contact-confirmation";
import ContactNotification, { type ContactEmailData } from "@/emails/contact-notification";
import QuoteConfirmation from "@/emails/quote-confirmation";
import QuoteNotification, { type QuoteEmailData } from "@/emails/quote-notification";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";

import { siteOrigin } from "./studio-link";

export type { KitLine } from "@/emails/_layout";
export type { QuoteEmailData };

export function quoteNotification(dict: Dictionary, data: QuoteEmailData, studioUrl: string, lang: Locale = defaultLocale) {
  const { emails } = dict;
  return {
    subject: format(emails.quoteNotify.subject, { name: data.name, count: data.kit.length }, lang),
    react: <QuoteNotification emails={emails} dates={dict.dates} data={data} studioUrl={studioUrl} siteUrl={siteOrigin()} />,
  };
}

export function quoteConfirmation(dict: Dictionary, data: QuoteEmailData) {
  const { emails } = dict;
  return {
    subject: emails.quoteConfirm.subject,
    react: <QuoteConfirmation emails={emails} dates={dict.dates} data={data} siteUrl={siteOrigin()} />,
  };
}

export function contactConfirmation(dict: Dictionary, data: ContactEmailData) {
  const { emails } = dict;
  const enquiryType = dict.contact.enquiryTypes[data.enquiryType as keyof typeof dict.contact.enquiryTypes] ?? data.enquiryType;
  return {
    subject: emails.contactConfirm.subject,
    react: <ContactConfirmation emails={emails} enquiryType={enquiryType} data={data} siteUrl={siteOrigin()} />,
  };
}

export function contactNotification(dict: Dictionary, data: ContactEmailData, studioUrl: string) {
  const { emails } = dict;
  return {
    subject: format(emails.contactNotify.subject, { name: data.name, type: data.enquiryType }),
    react: <ContactNotification emails={emails} data={data} studioUrl={studioUrl} siteUrl={siteOrigin()} />,
  };
}
