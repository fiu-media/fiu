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
/** The data each email is built from. */
type Data = {
  contactNotification: ContactEmailData;
  contactConfirmation: ContactEmailData;
  quoteNotification: QuoteEmailData;
  quoteConfirmation: QuoteEmailData;
};

export type EmailKind = keyof Data;

export type Built = { subject: string; react: React.ReactElement };

type Options = {
  /** Where the notifications link to; the Studio page of the stored document. */
  studioLink?: string;
  /** The language the email is written in, for formatting its subject. The dictionary is the caller's choice. */
  lang?: Locale;
};

/** The visitor's enquiry type as they saw it in the form, or as submitted if it isn't one we know. */
function enquiryLabel(dict: Dictionary, type: string) {
  return dict.contact.enquiryTypes[type as keyof typeof dict.contact.enquiryTypes] ?? type;
}

/** Every email, built the same way: its kind, the dictionary it is written in, and what the visitor submitted. */
export function build<K extends EmailKind>(
  kind: K,
  dict: Dictionary,
  data: Data[K],
  { studioLink = "", lang = defaultLocale }: Options = {},
): Built {
  const { emails } = dict;
  const siteUrl = siteOrigin();
  const quote = data as QuoteEmailData;
  const contact = data as ContactEmailData;

  switch (kind as EmailKind) {
    case "quoteNotification":
      return {
        subject: format(emails.quoteNotify.subject, { name: quote.name, count: quote.kit.length }, lang),
        react: <QuoteNotification emails={emails} dates={dict.dates} data={quote} studioUrl={studioLink} siteUrl={siteUrl} />,
      };
    case "quoteConfirmation":
      return {
        subject: emails.quoteConfirm.subject,
        react: <QuoteConfirmation emails={emails} dates={dict.dates} data={quote} siteUrl={siteUrl} />,
      };
    case "contactNotification":
      return {
        subject: format(
          emails.contactNotify.subject,
          { name: contact.name, type: enquiryLabel(dict, contact.enquiryType) },
          lang,
        ),
        react: <ContactNotification emails={emails} data={contact} studioUrl={studioLink} siteUrl={siteUrl} />,
      };
    case "contactConfirmation":
      return {
        subject: emails.contactConfirm.subject,
        react: (
          <ContactConfirmation
            emails={emails}
            enquiryType={enquiryLabel(dict, contact.enquiryType)}
            data={contact}
            siteUrl={siteUrl}
          />
        ),
      };
  }
}
