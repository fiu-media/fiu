import "server-only";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type Row = [label: string, value: string];
export type KitLine = { name: string; brand?: string | null; qty: number };

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const lineLabel = ({ name, brand, qty }: KitLine) => `${qty} × ${brand ? `${brand} ` : ""}${name}`;

function layout(heading: string, rows: Row[], extras: { intro?: string; kit?: KitLine[]; kitLabel?: string; link?: [string, string] }) {
  const row = ([label, value]: Row) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b6670;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#151316;max-width:560px">
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(heading)}</h1>
${extras.intro ? `<p style="margin:0 0 16px">${escapeHtml(extras.intro)}</p>` : ""}
<table style="border-collapse:collapse">${rows.map(row).join("")}</table>
${
  extras.kit?.length
    ? `<h2 style="font-size:15px;margin:20px 0 6px">${escapeHtml(extras.kitLabel ?? "")}</h2><ul style="margin:0;padding-left:20px">${extras.kit.map((l) => `<li>${escapeHtml(lineLabel(l))}</li>`).join("")}</ul>`
    : ""
}
${extras.link ? `<p style="margin:24px 0 0"><a href="${escapeHtml(extras.link[1])}">${escapeHtml(extras.link[0])}</a></p>` : ""}
</div>`;
  const text = [
    heading,
    extras.intro,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    extras.kit?.length ? `\n${extras.kitLabel}:\n${extras.kit.map((l) => `- ${lineLabel(l)}`).join("\n")}` : undefined,
    extras.link ? `\n${extras.link[0]}: ${extras.link[1]}` : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n");
  return { html, text };
}

const present = (rows: Row[]) => rows.filter(([, value]) => value.trim() !== "");

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

export function quoteNotification(dict: Dictionary, data: QuoteEmailData, studioUrl: string) {
  const { emails } = dict;
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
  return {
    subject: format(emails.quoteNotify.subject, { name: data.name, count: data.kit.length }),
    ...layout(emails.quoteNotify.heading, rows, { kit: data.kit, kitLabel: l.kit, link: [emails.quoteNotify.openInStudio, studioUrl] }),
  };
}

export function quoteConfirmation(dict: Dictionary, data: QuoteEmailData) {
  const { emails } = dict;
  const l = emails.labels;
  const rows = present([
    [l.dates, `${data.startDate} → ${data.endDate}`],
    [l.production, data.production],
    [l.message, data.message],
  ]);
  return {
    subject: emails.quoteConfirm.subject,
    ...layout(emails.quoteConfirm.heading, rows, { intro: emails.quoteConfirm.body, kit: data.kit, kitLabel: l.kit }),
  };
}

export function contactNotification(
  dict: Dictionary,
  data: { name: string; email: string; enquiryType: string; message: string },
  studioUrl: string,
) {
  const { emails } = dict;
  const l = emails.labels;
  return {
    subject: format(emails.contactNotify.subject, { name: data.name, type: data.enquiryType }),
    ...layout(
      emails.contactNotify.heading,
      [
        [l.name, data.name],
        [l.email, data.email],
        [l.enquiryType, data.enquiryType],
        [l.message, data.message],
      ],
      { link: [emails.contactNotify.openInStudio, studioUrl] },
    ),
  };
}
