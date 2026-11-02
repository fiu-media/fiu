"use server";

import { getRecipient } from "@/lib/email/settings";
import { studioEditUrl } from "@/lib/email/studio-link";
import { contactNotification } from "@/lib/email/templates";
import { isConflict, sendAll } from "@/lib/forms/notify";
import { contactSchema } from "@/lib/forms/schemas";
import { formSuccess, type FormState } from "@/lib/forms/state";
import { guardSubmission } from "@/lib/forms/submit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { writeClient } from "@/sanity/lib/writeClient";

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  const guarded = await guardSubmission(contactSchema, formData);
  if (!guarded.ok) return guarded.result;
  const data = guarded.data;
  const id = `contactMessage-${data.submissionId}`;

  try {
    await writeClient.create({
      _id: id,
      _type: "contactMessage",
      status: "new",
      name: data.name,
      email: data.email,
      enquiryType: data.enquiryType,
      message: data.message,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isConflict(error)) return formSuccess;
    console.error("[contact] could not store message:", error);
    return guarded.reply({ formErrors: ["failed"] });
  }

  const to = await getRecipient("contact", data.lang);
  if (!to) console.warn("[contact] no recipient configured (Site settings or QUOTE_TO_EMAIL); skipping notification");
  const dict = await getDictionary(data.lang);
  await sendAll([
    to ? { to, replyTo: data.email, ...contactNotification(dict, data, studioEditUrl(id, "contactMessage")) } : null,
  ]);

  return formSuccess;
}
