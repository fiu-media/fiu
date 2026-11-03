"use client";

import { useFormData } from "@conform-to/react/future";
import { useSearchParams } from "next/navigation";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { useConformForm } from "@/components/forms/useConformForm";
import { TalentPicker, type TalentOption } from "@/components/forms/TalentPicker";
import { GlassPanel } from "@/components/ui/Glass";
import { contactSchema, ENQUIRY_TYPES, isEnquiryType, limits } from "@/lib/forms/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { submitContact } from "./actions";

export function ContactForm({
  lang,
  dict,
  talent,
}: {
  lang: Locale;
  dict: Pick<Dictionary, "contact" | "forms">;
  /** The roster, for a Talent enquiry to pick from. */
  talent: TalentOption[];
}) {
  const { contact, forms } = dict;
  // `/contact?type=Talent&talent=aoife` (the "Work with" button on a talent page, and the Talent and Rentals pages)
  // preselects the enquiry type and ticks the people named. Slugs that aren't on the roster are ignored.
  const params = useSearchParams();
  const requested = params.get("type");
  const picked = params.getAll("talent");
  const enquiryType = isEnquiryType(requested) ? requested : ENQUIRY_TYPES[0];
  const conform = useConformForm({
    action: submitContact,
    schema: contactSchema,
    defaultValue: {
      enquiryType,
      // The form carries ids; the link carries slugs, which are what a visitor can read and share.
      talent: talent.filter((person) => picked.includes(person.slug)).map((person) => person.id),
    },
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
        <TalentPicker field={fields.talent} legend={contact.talent} optionalLabel={contact.optional} options={talent} />
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
