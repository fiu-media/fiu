import "server-only";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import ContactNotification, { type ContactEmailData } from "@/emails/contact-notification";
import QuoteConfirmation from "@/emails/quote-confirmation";
import QuoteNotification, { type QuoteEmailData } from "@/emails/quote-notification";

export type { KitLine } from "@/emails/_layout";
export type { QuoteEmailData };

export function quoteNotification(dict: Dictionary, data: QuoteEmailData, studioUrl: string) {
  const { emails } = dict;
  return {
    subject: format(emails.quoteNotify.subject, { name: data.name, count: data.kit.length }),
    react: <QuoteNotification emails={emails} data={data} studioUrl={studioUrl} />,
  };
}

export function quoteConfirmation(dict: Dictionary, data: QuoteEmailData) {
  const { emails } = dict;
  return {
    subject: emails.quoteConfirm.subject,
    react: <QuoteConfirmation emails={emails} data={data} />,
  };
}

export function contactNotification(dict: Dictionary, data: ContactEmailData, studioUrl: string) {
  const { emails } = dict;
  return {
    subject: format(emails.contactNotify.subject, { name: data.name, type: data.enquiryType }),
    react: <ContactNotification emails={emails} data={data} studioUrl={studioUrl} />,
  };
}
