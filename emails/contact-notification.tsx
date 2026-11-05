import type { Dictionary } from "../lib/i18n/dictionaries/en";
import { en } from "../lib/i18n/dictionaries/en";
import { Layout, mailto, present } from "./_layout";

/** `talent` is the names of the people the visitor asked about. */
export type ContactEmailData = { name: string; email: string; enquiryType: string; talent: string[]; message: string };

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
        [l.enquiryType, data.enquiryType],
        [l.talent, data.talent.join(", ")],
        [l.message, data.message],
      ])}
      link={[emails.contactNotify.openInStudio, studioUrl]}
    />
  );
}

ContactNotification.PreviewProps = {
  emails: en.emails,
  siteUrl: "http://localhost:3000",
  studioUrl: "https://fiu.sanity.studio/intent/edit/id=abc;type=contactMessage/",
  data: {
    name: "Aoife Ní Bhriain",
    email: "aoife@example.com",
    enquiryType: "Talent",
    talent: ["Aoife Ní Bhriain", "Seán Ó Súilleabháin"],
    message: "Hi, I'd love to talk about a project we're planning for spring.",
  },
} satisfies Props;
