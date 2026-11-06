import type { Dictionary } from "../lib/i18n/dictionaries/en";
import { en } from "../lib/i18n/dictionaries/en";
import { formatPhone } from "../lib/forms/phone";
import { Layout, mailto, present, tel } from "./_layout";

export type ContactEmailData = { name: string; email: string; phone: string; enquiryType: string; message: string };

type Props = { emails: Dictionary["emails"]; data: ContactEmailData; studioUrl: string; siteUrl: string };

export default function ContactNotification({ emails, data, studioUrl, siteUrl }: Props) {
  const l = emails.labels;
  return (
    <Layout
      heading={emails.contactNotify.heading}
      siteUrl={siteUrl}
      rows={present([
        [l.name, data.name],
        [l.email, data.email, mailto(data.email)],
        [l.phone, formatPhone(data.phone), tel(data.phone)],
        [l.enquiryType, data.enquiryType],
        [l.message, data.message],
      ])}
      link={[emails.contactNotify.openInStudio, studioUrl]}
    />
  );
}

ContactNotification.PreviewProps = {
  emails: en.emails,
  siteUrl: "https://fiú.ie",
  studioUrl: "https://fiu.sanity.studio/intent/edit/id=abc;type=contactMessage/",
  data: {
    name: "Aoife Ní Bhriain",
    email: "aoife@example.com",
    phone: "+353 87 123 4567",
    enquiryType: "Talent",
    message: "Hi, I'd love to talk about a project we're planning for spring.",
  },
} satisfies Props;
