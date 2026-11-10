"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { CopyLinkButton } from "@/components/forms/CopyLinkButton";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { RegisterLabel } from "@/components/forms/FormLabels";
import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { FormSuccess } from "@/components/forms/FormSuccess";
import { PhoneField } from "@/components/forms/PhoneField";
import { PrefillBoundary } from "@/components/forms/PrefillBoundary";
import { useConformForm } from "@/components/forms/useConformForm";
import { GlassPillLink } from "@/components/ui/Glass";
import { QuoteLines, useCatalogue, useQuoteBasket } from "@/features/rentals";
import { describeRange, isIsoDate, isValidRange, todayInDublin } from "@/lib/dates";
import type { CountryList } from "@/lib/forms/countries";
import { QUOTE_PARAMS, quoteHref, quotePrefill } from "@/lib/forms/prefill";
import { limits, quoteSchema } from "@/lib/forms/schemas";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { href, routes } from "@/lib/routes";

import { submitQuote } from "./actions";

type QuoteDict = Pick<Dictionary, "quote" | "basket" | "forms" | "common" | "dates">;

/** `countries` is for the phone field; built on the server (see `countryList`). */
type Props = { lang: Locale; dict: QuoteDict; countries: CountryList };

/** The form, which starts over whenever a link arrives with something to prefill (see `useFreshOnArrival`). */
export function QuoteForm(props: Props) {
  return <PrefillBoundary params={QUOTE_PARAMS}>{(key) => <QuoteFormFields key={key} {...props} />}</PrefillBoundary>;
}

function QuoteFormFields({ lang, dict, countries }: Props) {
  const { quote, forms } = dict;
  // `/rentals/quote?pickup=…&return=…&company=…&production=…&item=slug:2` prefills what isn't personal; see
  // lib/forms/prefill.ts. Text goes into the form; dates and items go into the basket, which is where they live.
  const params = useSearchParams();
  const catalogue = useCatalogue();
  const prefill = useMemo(() => quotePrefill(params, catalogue, todayInDublin()), [params, catalogue]);
  const conform = useConformForm({
    action: submitQuote,
    schema: quoteSchema,
    defaultValue: {
      ...(prefill.company && { company: prefill.company }),
      ...(prefill.production && { production: prefill.production }),
    },
  });
  const { fields, pending, succeeded, confirmed } = conform;
  const { lines, startDate, endDate, setDates, ensure, clear, ready } = useQuoteBasket();

  // The basket is read from the browser after mount, so a link's dates and items go in once that has happened. Before
  // paint, so the form never shows "Your quote is empty" for a link that has items. Setting rather than adding, so the
  // same link twice changes nothing; the basket's other items are kept. This form remounts on every arrival.
  const applied = useRef(false);
  useLayoutEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    if (prefill.start) setDates({ startDate: prefill.start });
    if (prefill.end) setDates({ endDate: prefill.end });
    for (const { itemId, qty, max } of prefill.items) ensure(itemId, qty, max);
  }, [ready, prefill, setDates, ensure]);

  /** A link that reopens this quote, for sending to someone else. Nothing personal goes in it. */
  const shareLink = () => {
    const data = new FormData(document.getElementById(conform.form.id) as HTMLFormElement);
    const text = (name: string) => (typeof data.get(name) === "string" ? (data.get(name) as string) : "");
    const path = quoteHref(lang, {
      start: isIsoDate(startDate) ? startDate : undefined,
      end: isIsoDate(endDate) ? endDate : undefined,
      company: text("company").trim() || undefined,
      production: text("production").trim() || undefined,
      items: lines.flatMap(({ itemId, qty }) => (catalogue[itemId] ? [{ slug: catalogue[itemId].slug, qty }] : [])),
    });
    return `${window.location.origin}${path}`;
  };

  useEffect(() => {
    if (succeeded) clear();
  }, [succeeded, clear]);

  // The basket only exists in the browser, so until it is read the form would flash "empty".
  if (!ready) return <QuoteFormSkeleton label={dict.common.loading} />;

  if (succeeded) {
    return (
      <FormSuccess
        title={quote.successTitle}
        body={confirmed ? quote.successBody : quote.successBodyNoEmail}
        action={{ href: href(lang, routes.rentals()), label: quote.successAction }}
      />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-xl">
        <p className="text-fg-muted">{quote.emptyBasket}</p>
        <GlassPillLink href={href(lang, routes.rentals())} className="mt-4">
          {quote.browse}
        </GlassPillLink>
      </div>
    );
  }

  return (
    <Form conform={conform} lang={lang} forms={forms} className="max-w-2xl gap-10">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      <section id={fields.items.id} aria-labelledby="quote-kit" className="flex flex-col gap-2">
        <RegisterLabel field={fields.items} label={quote.itemsHeading} />
        <h2 id="quote-kit" className="font-display text-2xl">
          {quote.itemsHeading}
        </h2>
        <QuoteLines dict={dict.basket} />
      </section>

      <DatesSection fields={fields} lang={lang} dict={dict} startDate={startDate} endDate={endDate} setDates={setDates} />

      <ContactSection fields={fields} dict={dict} countries={countries} />

      <div className="flex flex-col gap-6">
        <div>
          <SubmitButton pending={pending}>{pending ? forms.fields.sending : quote.submit}</SubmitButton>
        </div>
        {/* Apart from sending, under its own rule: the copied link leaves out what Send includes (contact details). */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-6">
          <CopyLinkButton
            label={quote.copyLink}
            copiedLabel={quote.linkCopied}
            failedLabel={quote.linkCopyFailed}
            shareLabel={quote.shareLink}
            shareTitle={quote.shareTitle}
            hint={quote.copyLinkHint}
            getLink={shareLink}
          />
        </div>
      </div>
    </Form>
  );
}

type QuoteFields = ReturnType<typeof useConformForm<typeof quoteSchema>>["fields"];

/** When the kit is needed. The dates live in the basket, not the form's own state, so the inputs are controlled. */
function DatesSection({
  fields,
  lang,
  dict,
  startDate,
  endDate,
  setDates,
}: {
  fields: QuoteFields;
  lang: Locale;
  dict: QuoteDict;
  startDate: string;
  endDate: string;
  setDates: ReturnType<typeof useQuoteBasket>["setDates"];
}) {
  const { quote } = dict;
  return (
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
          autoComplete="off"
          min={todayInDublin()}
          value={startDate}
          onChange={(v) => setDates({ startDate: v })}
        />
        <Field
          field={fields.endDate}
          type="date"
          label={quote.endDate}
          required
          autoComplete="off"
          min={startDate || undefined}
          value={endDate}
          onChange={(v) => setDates({ endDate: v })}
        />
      </div>
      <p aria-live="polite" className="min-h-6 text-fg-muted">
        {isValidRange(startDate, endDate) ? describeRange(dict.dates, lang, startDate, endDate) : null}
      </p>
    </section>
  );
}

/** Who is asking, and anything else the studio should know. */
function ContactSection({ fields, dict, countries }: { fields: QuoteFields; dict: QuoteDict; countries: CountryList }) {
  const { quote, forms } = dict;
  return (
    <section aria-labelledby="quote-contact" className="flex flex-col gap-4">
      <h2 id="quote-contact" className="font-display text-2xl">
        {quote.contactHeading}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          field={fields.name}
          label={forms.fields.name}
          required
          autoComplete="name"
          maxLength={limits.name}
          placeholder={forms.fields.placeholders.name}
        />
        <Field
          field={fields.email}
          type="email"
          label={forms.fields.email}
          required
          autoComplete="email"
          maxLength={limits.email}
          placeholder={forms.fields.placeholders.email}
        />
        <PhoneField
          field={fields.phone}
          label={forms.fields.phone}
          optionalLabel={forms.fields.optional}
          countryLabel={forms.fields.phoneCountry}
          countries={countries}
        />
        <Field
          field={fields.company}
          label={quote.company}
          optionalLabel={forms.fields.optional}
          autoComplete="organization"
          maxLength={limits.company}
          placeholder={quote.placeholders.company}
        />
      </div>
      <Field
        field={fields.production}
        label={quote.production}
        optionalLabel={forms.fields.optional}
        autoComplete="off"
        maxLength={limits.production}
        placeholder={quote.placeholders.production}
      />
      <Field
        field={fields.message}
        as="textarea"
        // An optional note after the form's real fields: starts small.
        minRows={3}
        maxRows={10}
        label={quote.message}
        optionalLabel={forms.fields.optional}
        autoComplete="off"
        maxLength={limits.message}
        placeholder={quote.placeholders.message}
      />
    </section>
  );
}
