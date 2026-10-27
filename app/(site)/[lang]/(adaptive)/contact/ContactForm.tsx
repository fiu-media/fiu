"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useRef } from "react";
import { Field, Honeypot } from "@/components/forms/Field";
import { FormErrorSummary, type SummaryItem } from "@/components/forms/FormErrorSummary";
import { GlassPanel, GlassPillButton } from "@/components/ui/Glass";
import { ENQUIRY_TYPES, isEnquiryType } from "@/lib/forms/schemas";
import { initialFormState, type FormErrorCode } from "@/lib/forms/state";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { submitContact } from "./actions";

export function ContactForm({ lang, dict }: { lang: Locale; dict: Pick<Dictionary, "contact" | "forms"> }) {
  const { contact, forms } = dict;
  const [state, formAction, pending] = useActionState(submitContact, initialFormState);
  // A retry after a failure reuses this id, so the server can recognise a double submit.
  const submissionId = useRef<string | null>(null);
  // `/contact?type=Talent` (from the Talent and Rentals pages) preselects the enquiry type.
  const requested = useSearchParams().get("type");
  const initialType = isEnquiryType(requested) ? requested : ENQUIRY_TYPES[0];

  if (state.status === "success") {
    return (
      <GlassPanel className="max-w-xl p-8" role="status">
        <h2 className="font-display text-3xl">{contact.successTitle}</h2>
        <p className="mt-3 text-fg-muted">{contact.successBody}</p>
      </GlassPanel>
    );
  }

  const fieldErrors = state.fieldErrors ?? {};
  const message = (code?: FormErrorCode) => (code ? forms.errors[code] : undefined);
  const err = (name: string) => message(fieldErrors[name]);
  const summary: SummaryItem[] = [
    ["enquiryType", contact.enquiryType],
    ["name", contact.name],
    ["email", contact.email],
    ["message", contact.message],
  ].flatMap(([name, label]) => {
    const text = err(name);
    return text ? [{ name, label, message: text }] : [];
  });
  const values = state.values ?? {};

  return (
    <form
      action={(formData) => {
        submissionId.current ??= crypto.randomUUID();
        formData.set("submissionId", submissionId.current);
        formAction(formData);
      }}
      className="relative flex max-w-xl flex-col gap-4"
    >
      <input type="hidden" name="lang" value={lang} />
      <Honeypot />

      {state.status === "error" && (
        <FormErrorSummary title={forms.errorSummary} items={summary} message={message(state.error)} attempt={state} />
      )}

      <Field
        name="enquiryType"
        as="select"
        label={contact.enquiryType}
        required
        defaultValue={isEnquiryType(values.enquiryType ?? null) ? values.enquiryType : initialType}
        error={err("enquiryType")}
      >
        {ENQUIRY_TYPES.map((type) => (
          <option key={type} value={type}>
            {contact.enquiryTypes[type]}
          </option>
        ))}
      </Field>
      <Field name="name" label={contact.name} required autoComplete="name" defaultValue={values.name} error={err("name")} />
      <Field
        name="email"
        type="email"
        label={contact.email}
        required
        autoComplete="email"
        defaultValue={values.email}
        error={err("email")}
      />
      <Field name="message" as="textarea" label={contact.message} required defaultValue={values.message} error={err("message")} />

      <div>
        <GlassPillButton type="submit" size="lg" disabled={pending} aria-disabled={pending}>
          {pending ? contact.sending : contact.submit}
        </GlassPillButton>
      </div>
    </form>
  );
}
