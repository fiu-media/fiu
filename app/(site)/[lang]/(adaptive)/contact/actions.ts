"use server";

import { getRecipient } from "@/lib/email/settings";
import { studioEditUrl } from "@/lib/email/studio-link";
import { contactNotification } from "@/lib/email/templates";
import { isConflict, saveContact, sendAll } from "@/lib/forms/notify";
import { contactSchema } from "@/lib/forms/schemas";
import type { FormState } from "@/lib/forms/state";
import { guardSubmission } from "@/lib/forms/submit";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { writeClient } from "@/sanity/lib/writeClient";

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  const guarded = await guardSubmission(contactSchema, formData);
  if (!guarded.ok) return guarded.result;
  const { data, fail, succeed } = guarded;
  const id = `contactMessage-${data.submissionId}`;

  try {
    await writeClient.create({
      _id: id,
      _type: "contactMessage",
      status: "new",
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      enquiryType: data.enquiryType,
      message: data.message,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isConflict(error)) return succeed();
    console.error("[contact] could not store message:", error);
    return fail({ formErrors: ["failed"] });
  }

  const to = await getRecipient("contact", data.lang);
  if (!to) console.warn("[contact] no recipient set in Site settings; skipping notification");
  // The notification goes to the team, so it is always in the default language.
  const dict = await getDictionary(defaultLocale);
  await Promise.all([
    sendAll([
      to
        ? {
            to,
            replyTo: data.email,
            ...contactNotification(dict, data, studioEditUrl(id, "contactMessage")),
          }
        : null,
    ]),
    saveContact({ name: data.name, email: data.email, phone: data.phone }),
  ]);

  return succeed();
}
