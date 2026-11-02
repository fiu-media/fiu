import type { Dictionary } from "../lib/i18n/dictionaries/en";
import { en } from "../lib/i18n/dictionaries/en";
import { describeRange } from "../lib/dates";
import { Layout, present } from "./_layout";
import type { QuoteEmailData } from "./quote-notification";

type Props = { emails: Dictionary["emails"]; dates: Dictionary["dates"]; data: QuoteEmailData };

export default function QuoteConfirmation({ emails, dates, data }: Props) {
  const l = emails.labels;
  const rows = present([
    [l.dates, describeRange(dates, data.lang, data.startDate, data.endDate)],
    [l.production, data.production],
    [l.message, data.message],
  ]);
  return (
    <Layout heading={emails.quoteConfirm.heading} intro={emails.quoteConfirm.body} rows={rows} kit={data.kit} kitLabel={l.kit} />
  );
}

QuoteConfirmation.PreviewProps = {
  emails: en.emails,
  dates: en.dates,
  data: {
    lang: "en",
    name: "Aoife Ní Bhriain",
    email: "aoife@example.com",
    phone: "",
    company: "",
    production: "Fáinne (short film)",
    startDate: "2026-12-01",
    endDate: "2026-12-03",
    message: "We need the kit for a three-day shoot in Galway.",
    kit: [
      { name: "FX6", brand: "Sony", qty: 1 },
      { name: "Aputure 300d", brand: null, qty: 2 },
    ],
  },
} satisfies Props;
