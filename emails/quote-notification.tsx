import type { Dictionary } from "../lib/i18n/dictionaries/en";
import { en } from "../lib/i18n/dictionaries/en";
import { Layout, present, type KitLine } from "./_layout";

export type QuoteEmailData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  production: string;
  startDate: string;
  endDate: string;
  message: string;
  kit: KitLine[];
};

type Props = { emails: Dictionary["emails"]; data: QuoteEmailData; studioUrl: string };

export default function QuoteNotification({ emails, data, studioUrl }: Props) {
  const l = emails.labels;
  const rows = present([
    [l.name, data.name],
    [l.email, data.email],
    [l.phone, data.phone],
    [l.company, data.company],
    [l.production, data.production],
    [l.dates, `${data.startDate} → ${data.endDate}`],
    [l.message, data.message],
  ]);
  return (
    <Layout heading={emails.quoteNotify.heading} rows={rows} kit={data.kit} kitLabel={l.kit} link={[emails.quoteNotify.openInStudio, studioUrl]} />
  );
}

QuoteNotification.PreviewProps = {
  emails: en.emails,
  studioUrl: "http://localhost:3000/studio/intent/edit/id=abc;type=quoteRequest/",
  data: {
    name: "Aoife Ní Bhriain",
    email: "aoife@example.com",
    phone: "+353 87 123 4567",
    company: "Cloch Films",
    production: "Fáinne (short film)",
    startDate: "2026-12-01",
    endDate: "2026-12-03",
    message: "We need the kit for a three-day shoot in Galway.\nPickup on the 30th if possible.",
    kit: [
      { name: "FX6", brand: "Sony", qty: 1 },
      { name: "Aputure 300d", brand: null, qty: 2 },
    ],
  },
} satisfies Props;
