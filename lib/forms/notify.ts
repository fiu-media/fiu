import "server-only";
import { sendEmail } from "@/lib/email/send";

type Email = Parameters<typeof sendEmail>[0];

/**
 * Send notification emails after a submission is safely stored. A failing email must never
 * turn a saved submission into an error for the visitor, so failures are only logged.
 */
export async function sendAll(emails: (Email | null)[]) {
  const results = await Promise.allSettled(emails.filter((e): e is Email => e !== null).map(sendEmail));
  for (const result of results) {
    if (result.status === "rejected") console.error("[email] delivery failed:", result.reason);
  }
}

export const isConflict = (error: unknown) =>
  typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 409;
