"use client";

import { useEffect } from "react";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { PhoneField } from "@/components/forms/PhoneField";
import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { useConformForm } from "@/components/forms/useConformForm";
import { QuoteLines } from "@/components/rentals/QuoteLines";
import { GlassPanel, GlassPillLink } from "@/components/ui/Glass";
import { describeRange, isValidRange, todayInDublin } from "@/lib/dates";
import { limits, quoteSchema } from "@/lib/forms/schemas";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { basketActions, useQuoteBasket } from "@/lib/quote-basket";
import { submitQuote } from "./actions";

type QuoteDict = Pick<Dictionary, "quote" | "basket" | "forms" | "common" | "dates">;

export function QuoteForm({ lang, dict }: { lang: Locale; dict: QuoteDict }) {
  const { quote, forms } = dict;
  const conform = useConformForm({ action: submitQuote, schema: quoteSchema });
  const { fields, pending, succeeded, confirmed } = conform;
  const { lines, startDate, endDate, setDates, ready } = useQuoteBasket();

  useEffect(() => {
    if (succeeded) basketActions.clear();
  }, [succeeded]);

  // The basket only exists in the browser, so until it is read the form would flash "empty".
  if (!ready) return <QuoteFormSkeleton label={dict.common.loading} />;

  if (succeeded) {
    return (
      <GlassPanel className="max-w-xl p-8" role="status">
        <h2 className="font-display text-3xl">{quote.successTitle}</h2>
        <p className="mt-3 text-fg-muted">{confirmed ? quote.successBody : quote.successBodyNoEmail}</p>
        <GlassPillLink href={localizedPath(lang, "/rentals")} className="mt-6">
          {quote.successAction}
        </GlassPillLink>
      </GlassPanel>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-xl">
        <p className="text-fg-muted">{quote.emptyBasket}</p>
        <GlassPillLink href={localizedPath(lang, "/rentals")} className="mt-4">
          {quote.browse}
        </GlassPillLink>
      </div>
    );
  }

  return (
    <Form
      conform={conform}
      lang={lang}
      forms={forms}
      labels={[
        ["items", quote.itemsHeading],
        ["name", quote.name],
        ["email", quote.email],
        ["phone", quote.phone],
        ["company", quote.company],
        ["production", quote.production],
        ["startDate", quote.startDate],
        ["endDate", quote.endDate],
        ["message", quote.message],
      ]}
      className="max-w-2xl gap-10"
    >
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      <section id={fields.items.id} aria-labelledby="quote-kit" className="flex flex-col gap-2">
        <h2 id="quote-kit" className="font-display text-2xl">
          {quote.itemsHeading}
        </h2>
        <QuoteLines dict={dict.basket} />
      </section>

      <section aria-labelledby="quote-dates" className="flex flex-col gap-4">
        <h2 id="quote-dates" className="font-display text-2xl">
          {quote.datesHeading}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Field
            field={fields.startDate}
            type="date"
            label={quote.startDate}
            required
            min={todayInDublin()}
            value={startDate}
            onChange={(v) => setDates({ startDate: v })}
          />
          <Field
            field={fields.endDate}
            type="date"
            label={quote.endDate}
            required
            min={startDate || undefined}
            value={endDate}
            onChange={(v) => setDates({ endDate: v })}
          />
        </div>
        <p aria-live="polite" className="min-h-6 text-fg-muted">
          {isValidRange(startDate, endDate) ? describeRange(dict.dates, lang, startDate, endDate) : null}
        </p>
      </section>

      <section aria-labelledby="quote-contact" className="flex flex-col gap-4">
        <h2 id="quote-contact" className="font-display text-2xl">
          {quote.contactHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field field={fields.name} label={quote.name} required autoComplete="name" maxLength={limits.name} />
          <Field field={fields.email} type="email" label={quote.email} required autoComplete="email" maxLength={limits.email} />
          <PhoneField field={fields.phone} label={quote.phone} optionalLabel={quote.optional} />
          <Field
            field={fields.company}
            label={quote.company}
            optionalLabel={quote.optional}
            autoComplete="organization"
            maxLength={limits.company}
          />
        </div>
        <Field field={fields.production} label={quote.production} optionalLabel={quote.optional} maxLength={limits.production} />
        <Field
          field={fields.message}
          as="textarea"
          label={quote.message}
          optionalLabel={quote.optional}
          maxLength={limits.message}
        />
      </section>

      <div>
        <SubmitButton pending={pending}>{pending ? quote.sending : quote.submit}</SubmitButton>
      </div>
    </Form>
  );
}
