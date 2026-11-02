"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, Honeypot } from "@/components/forms/Field";
import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { FormErrorSummary, type SummaryItem } from "@/components/forms/FormErrorSummary";
import { QuoteLines } from "@/components/rentals/QuoteLines";
import { GlassPanel, GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { describeRange, isValidRange } from "@/lib/dates";
import { initialFormState } from "@/lib/forms/state";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { basketActions, useQuoteBasket } from "@/lib/quote-basket";
import { submitQuote } from "./actions";

type QuoteDict = Pick<Dictionary, "quote" | "basket" | "forms" | "common" | "dates">;

export function QuoteForm({ lang, dict }: { lang: Locale; dict: QuoteDict }) {
  const { quote, forms } = dict;
  const [state, formAction, pending] = useActionState(submitQuote, initialFormState);
  const { lines, startDate, endDate, setDates, ready } = useQuoteBasket();
  // One id per attempt-to-submit: a retry after a failure reuses it, so the server can tell a
  // double submit from a new request. It is created on first submit because it must not be in
  // the server-rendered HTML.
  const submissionId = useRef<string | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      basketActions.clear();
      submissionId.current = null;
    }
  }, [state.status]);

  // The basket only exists in the browser, so until it is read the form would flash "empty".
  if (!ready) return <QuoteFormSkeleton label={dict.common.loading} />;

  if (state.status === "success") {
    return (
      <GlassPanel className="max-w-xl p-8" role="status">
        <h2 className="font-display text-3xl">{quote.successTitle}</h2>
        <p className="mt-3 text-fg-muted">{quote.successBody}</p>
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

  const message = (code?: keyof typeof forms.errors) => (code ? forms.errors[code] : undefined);
  const fieldErrors = state.fieldErrors ?? {};
  const labels: [string, string][] = [
    ["items", quote.itemsHeading],
    ["name", quote.name],
    ["email", quote.email],
    ["phone", quote.phone],
    ["company", quote.company],
    ["production", quote.production],
    ["startDate", quote.startDate],
    ["endDate", quote.endDate],
    ["message", quote.message],
  ];
  const summary: SummaryItem[] = labels.flatMap(([name, label]) => {
    const text = message(fieldErrors[name]);
    return text ? [{ name, label, message: text }] : [];
  });

  const values = state.values ?? {};
  const err = (name: string) => message(fieldErrors[name]);

  return (
    <form
      action={(formData) => {
        submissionId.current ??= crypto.randomUUID();
        formData.set("submissionId", submissionId.current);
        formData.set("items", JSON.stringify(lines));
        formAction(formData);
      }}
      className="relative flex max-w-2xl flex-col gap-10"
    >
      <input type="hidden" name="lang" value={lang} />
      <Honeypot />

      {state.status === "error" && (
        <FormErrorSummary title={forms.errorSummary} items={summary} message={message(state.error)} attempt={state} />
      )}

      <section aria-labelledby="quote-kit" className="flex flex-col gap-2">
        <h2 id="quote-kit" className="font-display text-2xl">
          {quote.itemsHeading}
        </h2>
        <QuoteLines dict={dict.basket} />
      </section>

      <section aria-labelledby="quote-dates" className="flex flex-col gap-4">
        <h2 id="quote-dates" className="font-display text-2xl">
          {quote.datesHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="startDate"
            type="date"
            label={quote.startDate}
            required
            value={startDate}
            onChange={(v) => setDates({ startDate: v })}
            error={err("startDate")}
          />
          <Field
            name="endDate"
            type="date"
            label={quote.endDate}
            required
            min={startDate || undefined}
            value={endDate}
            onChange={(v) => setDates({ endDate: v })}
            error={err("endDate")}
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
          <Field name="name" label={quote.name} required autoComplete="name" defaultValue={values.name} error={err("name")} />
          <Field
            name="email"
            type="email"
            label={quote.email}
            required
            autoComplete="email"
            defaultValue={values.email}
            error={err("email")}
          />
          <Field
            name="phone"
            type="tel"
            label={quote.phone}
            optionalLabel={quote.optional}
            autoComplete="tel"
            defaultValue={values.phone}
            error={err("phone")}
          />
          <Field
            name="company"
            label={quote.company}
            optionalLabel={quote.optional}
            autoComplete="organization"
            defaultValue={values.company}
            error={err("company")}
          />
        </div>
        <Field
          name="production"
          label={quote.production}
          optionalLabel={quote.optional}
          defaultValue={values.production}
          error={err("production")}
        />
        <Field
          name="message"
          as="textarea"
          label={quote.message}
          optionalLabel={quote.optional}
          defaultValue={values.message}
          error={err("message")}
        />
      </section>

      <div>
        <GlassPillButton type="submit" size="lg" disabled={pending} aria-disabled={pending}>
          {pending ? quote.sending : quote.submit}
        </GlassPillButton>
      </div>
    </form>
  );
}
