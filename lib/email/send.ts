import "server-only";
import { Resend } from "resend";

const SANDBOX_FROM = "Fiú Media <onboarding@resend.dev>";

type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

/**
 * Sends through Resend. Without RESEND_API_KEY (local dev, unconfigured previews) the email is
 * logged and skipped, so the form still works end to end.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY is not set; skipping "${subject}" to ${to}\n${text}`);
    return;
  }
  const { error } = await new Resend(key).emails.send({
    from: process.env.EMAIL_FROM || SANDBOX_FROM,
    to,
    subject,
    html,
    text,
    replyTo,
  });
  if (error) throw new Error(`Resend rejected "${subject}": ${error.name}: ${error.message}`);
}
