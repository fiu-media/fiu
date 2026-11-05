"use server";

import { getRecipient } from "@/lib/email/settings";
import { studioEditUrl } from "@/lib/email/studio-link";
import { contactNotification } from "@/lib/email/templates";
import { isConflict, sendAll } from "@/lib/forms/notify";
import { contactSchema } from "@/lib/forms/schemas";
import type { FormState } from "@/lib/forms/state";
import { guardSubmission } from "@/lib/forms/submit";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TALENTS_BY_ID_QUERY } from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/writeClient";

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  const guarded = await guardSubmission(contactSchema, formData);
  if (!guarded.ok) return guarded.result;
  const { data, fail, succeed } = guarded;
  const id = `contactMessage-${data.submissionId}`;

  // Who the visitor asked about only counts for a Talent enquiry, and has to be someone on the roster.
  const picked = data.enquiryType === "Talent" ? [...new Set(data.talent)] : [];
  const roster =
    picked.length > 0 ? await writeClient.fetch(TALENTS_BY_ID_QUERY, { ids: picked, fallbackLang: defaultLocale }) : [];
  const talent = picked.flatMap((pick) => roster.find((person) => person._id === pick) ?? []);
  if (talent.length !== picked.length) return fail({ fieldErrors: { talent: ["invalid"] } });

  try {
    await writeClient.create({
      _id: id,
      _type: "contactMessage",
      status: "new",
      name: data.name,
      email: data.email,
      enquiryType: data.enquiryType,
      talent: talent.map((person) => ({
        _key: person._id.replace(/[^a-zA-Z0-9]/g, "").slice(-12) || person._id,
        _type: "reference",
        _ref: person._id,
      })),
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
  await sendAll([
    to
      ? {
          to,
          replyTo: data.email,
          ...contactNotification(
            dict,
            { ...data, talent: talent.map((person) => person.name) },
            studioEditUrl(id, "contactMessage"),
          ),
        }
      : null,
  ]);

  return succeed();
}
