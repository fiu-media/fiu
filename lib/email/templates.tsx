import "server-only";

import ContactConfirmation from "@/emails/contact-confirmation";
import ContactNotification, { type ContactEmailData } from "@/emails/contact-notification";
import QuoteConfirmation from "@/emails/quote-confirmation";
import QuoteNotification, { type QuoteEmailData } from "@/emails/quote-notification";
import { isEnquiryType } from "@/lib/forms/enquiry-types";
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

type EmailKind = keyof Data;

export type Built = { subject: string; react: React.ReactElement };

/** `build`'s arguments, one tuple per kind, so checking the kind also tells TypeScript which data came with it. */
type BuildArgs = { [K in EmailKind]: [kind: K, dict: Dictionary, data: Data[K], options?: Options] }[EmailKind];

type Options = {
  /** Where the notifications link to; the Studio page of the stored document. */
  studioLink?: string;
  /** The language the email is written in, for formatting its subject. The dictionary is the caller's choice. */
  lang?: Locale;
};

/** The visitor's enquiry type as they saw it in the form, or as submitted if it isn't one we know. */
function enquiryLabel(dict: Dictionary, type: string) {
  return isEnquiryType(type) ? dict.contact.enquiryTypes[type] : type;
}

/** Every email, built the same way: its kind, the dictionary it is written in, and what the visitor submitted. */
export function build(...[kind, dict, data, options]: BuildArgs): Built {
  const { studioLink = "", lang = defaultLocale } = options ?? {};
  const { emails } = dict;
  const siteUrl = siteOrigin();

  switch (kind) {
    case "quoteNotification":
      return {
        subject: format(emails.quoteNotify.subject, { name: data.name, count: data.kit.length }, lang),
        react: <QuoteNotification emails={emails} dates={dict.dates} data={data} studioUrl={studioLink} siteUrl={siteUrl} />,
      };
    case "quoteConfirmation":
      return {
        subject: emails.quoteConfirm.subject,
        react: <QuoteConfirmation emails={emails} dates={dict.dates} data={data} siteUrl={siteUrl} />,
      };
    case "contactNotification":
      return {
        subject: format(emails.contactNotify.subject, { name: data.name, type: enquiryLabel(dict, data.enquiryType) }, lang),
        react: <ContactNotification emails={emails} data={data} studioUrl={studioLink} siteUrl={siteUrl} />,
      };
    case "contactConfirmation":
      return {
        subject: emails.contactConfirm.subject,
        react: (
          <ContactConfirmation emails={emails} enquiryType={enquiryLabel(dict, data.enquiryType)} data={data} siteUrl={siteUrl} />
        ),
      };
  }
}
