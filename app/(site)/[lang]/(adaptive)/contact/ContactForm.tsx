"use client";

import { useFormData } from "@conform-to/react/future";
import { useSearchParams } from "next/navigation";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { useConformForm } from "@/components/forms/useConformForm";
import { useFreshOnArrival } from "@/components/forms/useFreshOnArrival";
import { TalentCombobox, type TalentOption } from "@/components/forms/TalentCombobox";
import { GlassPanel } from "@/components/ui/Glass";
import { CONTACT_PARAMS, contactPrefill, prefillKey } from "@/lib/forms/prefill";
import { contactSchema, ENQUIRY_TYPES, limits } from "@/lib/forms/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { submitContact } from "./actions";

type Props = {
  lang: Locale;
  dict: Pick<Dictionary, "contact" | "forms">;
  /** The roster, for a Talent enquiry to pick from. */
  talent: TalentOption[];
};

/** The form, which starts over whenever a link arrives with a type or talent to prefill (see `useFreshOnArrival`). */
export function ContactForm(props: Props) {
  const params = useSearchParams();
  const fresh = useFreshOnArrival(prefillKey(params, CONTACT_PARAMS));
  return <ContactFormFields key={fresh} {...props} />;
}

function ContactFormFields({ lang, dict, talent }: Props) {
  const { contact, forms } = dict;
  // `/contact?type=Talent&talent=aoife` (the "Work with" button on a talent page) preselects the enquiry type and
  // ticks the people named; see lib/forms/prefill.ts.
  const { enquiryType, talent: pickedIds } = contactPrefill(useSearchParams(), talent);
  const conform = useConformForm({
    action: submitContact,
    schema: contactSchema,
    defaultValue: { enquiryType, talent: pickedIds },
  });
  const { fields, pending } = conform;
  // Whoever is picked is only asked about, and only stored, for a Talent enquiry.
  const type = useFormData(conform.form.id, (data) => data.get("enquiryType"), { fallback: enquiryType });

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
      {type === "Talent" && (
        <TalentCombobox field={fields.talent} labels={{ ...contact.talent, optional: contact.optional }} options={talent} />
      )}
      <Field
        field={fields.name}
        label={contact.name}
        required
        autoComplete="name"
        maxLength={limits.name}
        placeholder={contact.placeholders.name}
      />
      <Field
        field={fields.email}
        type="email"
        label={contact.email}
        required
        autoComplete="email"
        maxLength={limits.email}
        placeholder={contact.placeholders.email}
      />
      <Field
        field={fields.message}
        as="textarea"
        label={contact.message}
        required
        maxLength={limits.message}
        placeholder={contact.placeholders.message}
      />

      <div>
        <SubmitButton pending={pending}>{pending ? contact.sending : contact.submit}</SubmitButton>
      </div>
    </Form>
  );
}
