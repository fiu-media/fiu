"use client";

import { useSearchParams } from "next/navigation";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { useConformForm } from "@/components/forms/useConformForm";
import { GlassPanel } from "@/components/ui/Glass";
import { contactSchema, ENQUIRY_TYPES, isEnquiryType } from "@/lib/forms/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { submitContact } from "./actions";

export function ContactForm({ lang, dict }: { lang: Locale; dict: Pick<Dictionary, "contact" | "forms"> }) {
  const { contact, forms } = dict;
  // `/contact?type=Talent` (from the Talent and Rentals pages) preselects the enquiry type.
  const requested = useSearchParams().get("type");
  const conform = useConformForm({
    action: submitContact,
    schema: contactSchema,
    defaultValue: { enquiryType: isEnquiryType(requested) ? requested : ENQUIRY_TYPES[0] },
  });
  const { fields, pending } = conform;

  if (conform.succeeded) {
    return (
      <GlassPanel className="max-w-xl p-8" role="status">
        <h2 className="font-display text-3xl">{contact.successTitle}</h2>
        <p className="mt-3 text-fg-muted">{contact.successBody}</p>
      </GlassPanel>
    );
  }

  return (
    <Form
      conform={conform}
      lang={lang}
      forms={forms}
      labels={[
        ["enquiryType", contact.enquiryType],
        ["name", contact.name],
        ["email", contact.email],
        ["message", contact.message],
      ]}
      className="max-w-xl gap-4"
    >
      <Field field={fields.enquiryType} as="select" label={contact.enquiryType} required>
        {ENQUIRY_TYPES.map((type) => (
          <option key={type} value={type}>
            {contact.enquiryTypes[type]}
          </option>
        ))}
      </Field>
      <Field field={fields.name} label={contact.name} required autoComplete="name" />
      <Field field={fields.email} type="email" label={contact.email} required autoComplete="email" />
      <Field field={fields.message} as="textarea" label={contact.message} required />

      <div>
        <SubmitButton pending={pending}>{pending ? contact.sending : contact.submit}</SubmitButton>
      </div>
    </Form>
  );
}
