"use server";

import { build } from "@/lib/email/templates";
import { saveContact } from "@/lib/forms/notify";
import { contactSchema } from "@/lib/forms/schemas";
import type { FormState } from "@/lib/forms/state";
import { handleSubmission } from "@/lib/forms/submit";

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  return handleSubmission(
    {
      schema: contactSchema,
      docType: "contactMessage",
      recipient: "contact",
      toDocument: (data) => ({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        enquiryType: data.enquiryType,
        message: data.message,
      }),
      emails: ({ data, dict, teamDict, studioLink }) => ({
        notification: build("contactNotification", teamDict, data, { studioLink }),
        confirmation: build("contactConfirmation", dict, data, { lang: data.lang }),
      }),
      after: ({ name, email, phone }) => saveContact({ name, email, phone }),
    },
    formData,
  );
}
