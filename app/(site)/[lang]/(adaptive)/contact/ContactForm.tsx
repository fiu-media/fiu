"use client";

import { useSearchParams } from "next/navigation";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { PhoneField } from "@/components/forms/PhoneField";
import { useConformForm } from "@/components/forms/useConformForm";
import { useFreshOnArrival } from "@/components/forms/useFreshOnArrival";
import { GlassPanel } from "@/components/ui/Glass";
import type { CountryList } from "@/lib/forms/countries";
import { CONTACT_PARAMS, contactPrefill, prefillKey } from "@/lib/forms/prefill";
import { contactSchema, ENQUIRY_TYPES, limits } from "@/lib/forms/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { submitContact } from "./actions";

type Props = {
  lang: Locale;
  dict: Pick<Dictionary, "contact" | "forms">;
  /** For the phone field; built on the server (see `countryList`). */
  countries: CountryList;
};

/** The form, which starts over whenever a link arrives with a type to prefill (see `useFreshOnArrival`). */
export function ContactForm(props: Props) {
  const params = useSearchParams();
  const fresh = useFreshOnArrival(prefillKey(params, CONTACT_PARAMS));
  return <ContactFormFields key={fresh} {...props} />;
}

function ContactFormFields({ lang, dict, countries }: Props) {
  const { contact, forms } = dict;
  // `/contact?type=Talent` preselects the enquiry type; see lib/forms/prefill.ts.
  const { enquiryType } = contactPrefill(useSearchParams());
  const conform = useConformForm({
    action: submitContact,
    schema: contactSchema,
    defaultValue: { enquiryType },
  });
  const { fields, pending } = conform;

  if (conform.succeeded) {
    return (
      <GlassPanel className="max-w-xl p-8" role="status">
        <h2 className="font-display text-3xl">{contact.successTitle}</h2>
        <p className="mt-3 text-fg-muted">{conform.confirmed ? contact.successBody : contact.successBodyNoEmail}</p>
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
        ["phone", contact.phone],
        ["message", contact.message],
      ]}
      className="max-w-xl gap-4"
    >
      <Field field={fields.enquiryType} as="select" label={contact.enquiryType} required autoComplete="off">
        {ENQUIRY_TYPES.map((type) => (
          <option key={type} value={type}>
            {contact.enquiryTypes[type]}
          </option>
        ))}
      </Field>
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
      <PhoneField
        field={fields.phone}
        label={contact.phone}
        optionalLabel={contact.optional}
        countryLabel={contact.phoneCountry}
        countries={countries}
      />
      <Field
        field={fields.message}
        as="textarea"
        // The main body of the enquiry: room to write, and a lot more before it scrolls.
        minRows={6}
        maxRows={16}
        label={contact.message}
        required
        autoComplete="off"
        maxLength={limits.message}
        placeholder={contact.placeholders.message}
      />

      <div>
        <SubmitButton pending={pending}>{pending ? contact.sending : contact.submit}</SubmitButton>
      </div>
    </Form>
  );
}
