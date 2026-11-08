import "server-only";

import { Resend } from "resend";

import { env } from "@/env";

import { toDeliverable } from "./address";

type Contact = { name: string; email: string; phone?: string };

/** "Aoife Ní Bhriain" is first name "Aoife" and last name "Ní Bhriain"; a single word has no last name. */
export function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  return { firstName, lastName: lastName || undefined };
}

/**
 * Records a visitor as a Resend contact in the RESEND_SEGMENT_ID segment. They're added unsubscribed: the form has
 * no marketing opt-in, so they stay out of broadcasts until someone subscribes them in Resend. The phone
 * number goes in a custom `phone` contact property, which has to exist in Resend. Without RESEND_API_KEY
 * (local dev) it's logged and skipped, like the emails.
 */
export async function createContact({ name, email, phone }: Contact) {
  const address = toDeliverable(email);
  if (!address) {
    console.warn(`[contact] ${email} not added to Resend: it can't be delivered through Resend (non-ASCII before the @)`);
    return;
  }
  const { RESEND_API_KEY: key, RESEND_SEGMENT_ID: segment } = env;
  if (!key) {
    console.warn(`[contact] RESEND_API_KEY is not set; skipping Resend contact for ${email}`);
    return;
  }
  const { error } = await new Resend(key).contacts.create({
    email: address,
    ...splitName(name),
    unsubscribed: true,
    segments: segment ? [{ id: segment }] : undefined,
    properties: phone ? { phone } : undefined,
  });
  if (error) throw new Error(`Resend rejected contact ${email}: ${error.name}: ${error.message}`);
}
