import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { env } from "@/env";
import { toDeliverable } from "./address";
import { senderFor } from "./sender";

/** Keep headings as written (html-to-text uppercases them) and lay the detail rows out as columns. */
export const plainTextOptions = {
  plainText: true,
  htmlToTextOptions: {
    selectors: [
      { selector: "h1", options: { uppercase: false } },
      { selector: "h2", options: { uppercase: false } },
      { selector: "table", format: "dataTable" },
      // The logo is an image link home; as text it would only open the email with a bare URL.
      { selector: "a.logo", format: "skip" },
    ],
  },
} as const;

type Email = { to: string; subject: string; react: ReactElement; replyTo?: string };

/**
 * Sends through Resend, which renders `react` to the HTML part; the plain-text part is rendered
 * here. Without RESEND_API_KEY and RESEND_EMAIL_DOMAIN (local dev) the email is logged and
 * skipped, so the form still works end to end.
 */
export async function sendEmail({ to, subject, react, replyTo }: Email) {
  // Resend speaks ASCII SMTP: an internationalised domain goes out as punycode, and an address with an
  // accented local part can't go out at all (the visitor's address is still in the body of the studio's copy).
  const recipient = toDeliverable(to);
  if (!recipient) {
    console.warn(`[email] "${subject}" not sent: ${to} can't be delivered through Resend (non-ASCII before the @)`);
    return;
  }
  const replyAddress = replyTo === undefined ? undefined : (toDeliverable(replyTo) ?? undefined);
  const text = await render(react, plainTextOptions);
  const { RESEND_API_KEY: key, RESEND_EMAIL_DOMAIN: domain } = env;
  if (!key || !domain) {
    console.warn(`[email] RESEND_API_KEY or RESEND_EMAIL_DOMAIN is not set; skipping "${subject}" to ${to}\n${text}`);
    return;
  }
  const { error } = await new Resend(key).emails.send({
    from: senderFor(domain),
    to: recipient,
    subject,
    react,
    text,
    replyTo: replyAddress,
  });
  if (error) throw new Error(`Resend rejected "${subject}": ${error.name}: ${error.message}`);
}
