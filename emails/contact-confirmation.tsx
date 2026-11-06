import type { Dictionary } from "../lib/i18n/dictionaries/en";
import { en } from "../lib/i18n/dictionaries/en";
import { Layout, present } from "./_layout";
import type { ContactEmailData } from "./contact-notification";

type Props = {
  emails: Dictionary["emails"];
  /** The enquiry type as the visitor saw it, in their language. */
  enquiryType: string;
  data: ContactEmailData;
  siteUrl: string;
};

/** The visitor's copy of what they sent. No phone or email rows: they know their own details. */
export default function ContactConfirmation({ emails, enquiryType, data, siteUrl }: Props) {
  const l = emails.labels;
  return (
    <Layout
      heading={emails.contactConfirm.heading}
      siteUrl={siteUrl}
      intro={emails.contactConfirm.body}
      rows={present([
        [l.enquiryType, enquiryType],
        [l.message, data.message],
      ])}
      signoff={emails.contactConfirm.signoff}
    />
  );
}

ContactConfirmation.PreviewProps = {
  emails: en.emails,
  siteUrl: "https://fiú.ie",
  enquiryType: en.contact.enquiryTypes.Talent,
  data: {
    name: "Aoife Ní Bhriain",
    email: "aoife@example.com",
    phone: "+353 87 123 4567",
    enquiryType: "Talent",
    message: "Hi, I'd love to talk about a project we're planning for spring.",
  },
} satisfies Props;
