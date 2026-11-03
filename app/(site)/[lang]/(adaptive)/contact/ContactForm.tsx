"use client";

import { useFormData } from "@conform-to/react/future";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { useConformForm } from "@/components/forms/useConformForm";
import { TalentCombobox, type TalentOption } from "@/components/forms/TalentCombobox";
import { GlassPanel } from "@/components/ui/Glass";
import { contactSchema, ENQUIRY_TYPES, isEnquiryType, limits } from "@/lib/forms/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { submitContact } from "./actions";

type Props = {
  lang: Locale;
  dict: Pick<Dictionary, "contact" | "forms">;
  /** The roster, for a Talent enquiry to pick from. */
  talent: TalentOption[];
};

/**
 * The form, which starts over every time a link arrives with something to prefill. Next keeps a page's state while
 * you browse elsewhere (so a half-written message survives a trip to the Talent pages), which also means a
 * link like "Work with Aoife" lands on the old form: old answers, old errors, a "Message sent" panel, and none of
 * what the link asked for. A link that names a type or talent gets a fresh form, even if it is the very same link
 * as last time; coming back with a plain link keeps the draft.
 *
 * "Arrives" is detected from the page being shown again: React runs a kept-alive page's effects afresh each time it
 * is shown, and again when its prefill changes while it is showing.
 */
export function ContactForm(props: Props) {
  const params = useSearchParams();
  const prefill = new URLSearchParams([...params].filter(([key]) => key === "type" || key === "talent")).toString();
  const [fresh, setFresh] = useState(0);
  // False until the first run has settled, so mounting the page doesn't count as an arrival. (In development React
  // runs a mounting effect twice in a row; the timer, which only fires after both, keeps that from counting either.)
  const settled = useRef(false);
  useEffect(() => {
    const arrived = settled.current && prefill !== "";
    const timer = setTimeout(() => {
      settled.current = true;
      if (arrived) setFresh((count) => count + 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [prefill]);
  return <ContactFormFields key={fresh} {...props} />;
}

function ContactFormFields({ lang, dict, talent }: Props) {
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
