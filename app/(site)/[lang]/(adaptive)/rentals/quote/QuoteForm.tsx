"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CopyLinkButton } from "@/components/forms/CopyLinkButton";
import { Field } from "@/components/forms/Field";
import { Form, SubmitButton } from "@/components/forms/Form";
import { PhoneField } from "@/components/forms/PhoneField";
import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { useConformForm } from "@/components/forms/useConformForm";
import { useFreshOnArrival } from "@/components/forms/useFreshOnArrival";
import { useCatalogue } from "@/components/rentals/CatalogueContext";
import { QuoteLines } from "@/components/rentals/QuoteLines";
import { GlassPanel, GlassPillLink } from "@/components/ui/Glass";
import { describeRange, isIsoDate, isValidRange, todayInDublin } from "@/lib/dates";
import { catalogueSlug, prefillKey, QUOTE_PARAMS, quoteHref, quotePrefill } from "@/lib/forms/prefill";
import { limits, quoteSchema } from "@/lib/forms/schemas";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { basketActions, useQuoteBasket } from "@/lib/quote-basket";
import { submitQuote } from "./actions";

type QuoteDict = Pick<Dictionary, "quote" | "basket" | "forms" | "common" | "dates">;

type Props = { lang: Locale; dict: QuoteDict };

/** The form, which starts over whenever a link arrives with something to prefill (see `useFreshOnArrival`). */
export function QuoteForm(props: Props) {
  const params = useSearchParams();
  const fresh = useFreshOnArrival(prefillKey(params, QUOTE_PARAMS));
  return <QuoteFormFields key={fresh} {...props} />;
}

function QuoteFormFields({ lang, dict }: Props) {
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
  const { lines, startDate, endDate, setDates, ready } = useQuoteBasket();

  // The basket is read from the browser after mount, so a link's dates and items go in once that has happened. Before
  // paint, so the form never shows "Your quote is empty" for a link that has items. Setting rather than adding, so the
  // same link twice changes nothing; the basket's other items are kept. This form remounts on every arrival.
  const applied = useRef(false);
  useLayoutEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    if (prefill.start) setDates({ startDate: prefill.start });
    if (prefill.end) setDates({ endDate: prefill.end });
    for (const { itemId, qty, max } of prefill.items) basketActions.ensure(itemId, qty, max);
  }, [ready, prefill, setDates]);

  /** A link that reopens this quote, for sending to someone else. Nothing personal goes in it. */
  const shareLink = () => {
    const data = new FormData(document.getElementById(conform.form.id) as HTMLFormElement);
    const text = (name: string) => (typeof data.get(name) === "string" ? (data.get(name) as string) : "");
    const path = quoteHref(lang, {
      start: isIsoDate(startDate) ? startDate : undefined,
      end: isIsoDate(endDate) ? endDate : undefined,
      company: text("company").trim() || undefined,
      production: text("production").trim() || undefined,
      items: lines.flatMap(({ itemId, qty }) =>
        catalogue[itemId] ? [{ slug: catalogueSlug(catalogue[itemId].href), qty }] : [],
      ),
    });
    return `${window.location.origin}${path}`;
  };

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
          <Field
            field={fields.name}
            label={quote.name}
            required
            autoComplete="name"
            maxLength={limits.name}
            placeholder={quote.placeholders.name}
          />
          <Field
            field={fields.email}
            type="email"
            label={quote.email}
            required
            autoComplete="email"
            maxLength={limits.email}
            placeholder={quote.placeholders.email}
          />
          <PhoneField field={fields.phone} label={quote.phone} optionalLabel={quote.optional} countryLabel={quote.phoneCountry} />
          <Field
            field={fields.company}
            label={quote.company}
            optionalLabel={quote.optional}
            autoComplete="organization"
            maxLength={limits.company}
            placeholder={quote.placeholders.company}
          />
        </div>
        <Field
          field={fields.production}
          label={quote.production}
          optionalLabel={quote.optional}
          maxLength={limits.production}
          placeholder={quote.placeholders.production}
        />
        <Field
          field={fields.message}
          as="textarea"
          label={quote.message}
          optionalLabel={quote.optional}
          maxLength={limits.message}
          placeholder={quote.placeholders.message}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{pending ? quote.sending : quote.submit}</SubmitButton>
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
    </Form>
  );
}
