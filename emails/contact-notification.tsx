import type { Dictionary } from "../lib/i18n/dictionaries/en";
import { en } from "../lib/i18n/dictionaries/en";
import { Layout } from "./_layout";

export type ContactEmailData = { name: string; email: string; enquiryType: string; message: string };

type Props = { emails: Dictionary["emails"]; data: ContactEmailData; studioUrl: string };

export default function ContactNotification({ emails, data, studioUrl }: Props) {
  const l = emails.labels;
  return (
    <Layout
      heading={emails.contactNotify.heading}
      rows={[
        [l.name, data.name],
        [l.email, data.email],
        [l.enquiryType, data.enquiryType],
        [l.message, data.message],
      ]}
      link={[emails.contactNotify.openInStudio, studioUrl]}
    />
  );
}

ContactNotification.PreviewProps = {
  emails: en.emails,
  studioUrl: "http://localhost:3000/studio/intent/edit/id=abc;type=contactMessage/",
  data: {
    name: "Aoife Ní Bhriain",
    email: "aoife@example.com",
    enquiryType: "Talent",
    message: "Hi, I'd love to talk about a project we're planning for spring.",
  },
} satisfies Props;
