import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { env } from "@/env";

const SANDBOX_FROM = "Fiú Media <onboarding@resend.dev>";

/** Keep headings as written (html-to-text uppercases them) and lay the detail rows out as columns. */
export const plainTextOptions = {
  plainText: true,
  htmlToTextOptions: {
    selectors: [
      { selector: "h1", options: { uppercase: false } },
      { selector: "h2", options: { uppercase: false } },
      { selector: "table", format: "dataTable" },
    ],
  },
} as const;

type Email = { to: string; subject: string; react: ReactElement; replyTo?: string };

/**
 * Sends through Resend, which renders `react` to the HTML part; the plain-text part is rendered
 * here. Without RESEND_API_KEY (local dev, unconfigured previews) the email is logged and
 * skipped, so the form still works end to end.
 */
export async function sendEmail({ to, subject, react, replyTo }: Email) {
  const text = await render(react, plainTextOptions);
  const key = env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY is not set; skipping "${subject}" to ${to}\n${text}`);
    return;
  }
  const { error } = await new Resend(key).emails.send({
    from: env.EMAIL_FROM || SANDBOX_FROM,
    to,
    subject,
    react,
    text,
    replyTo,
  });
  if (error) throw new Error(`Resend rejected "${subject}": ${error.name}: ${error.message}`);
}
