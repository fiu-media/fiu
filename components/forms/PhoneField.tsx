"use client";

import { BaseControl, useControl } from "@conform-to/react/future";
import * as flags from "country-flag-icons/react/3x2";
import { getCountries, type CountryCode } from "libphonenumber-js/min";
import { useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import { callingCode, caretWithDigitsAfter, digitsIn, initial, interpret } from "@/lib/forms/phone";
import { chevron, controlClass, FieldFrame, placeholderClass, type FieldProps } from "./Field";

/** What an example looks like, as the number input shows it (no trunk 0, no dialling code). */
const SAMPLE: Partial<Record<CountryCode, string>> = { IE: "(83) 123 4567" };

/** Listed first: where the studio is, and where most visitors will be calling from. */
const PINNED: CountryCode[] = ["IE", "GB", "US"];

const FLAGS = flags as unknown as Record<string, React.ComponentType<React.SVGAttributes<SVGElement>> | undefined>;
/**
 * A phone number: a country select (flag; name and dialling code in the list) and the number itself. The
 * country's dialling code sits in front of the number as plain text, so the number is written without it, and
 * without the 0 that national numbers start with, but typing either is fine. Built on libphonenumber-js.
 * What the form submits is one E.164 value ("+353831234567"), through a hidden control Conform watches, so
 * validation and error focus work like any field.
 */
export function PhoneField({
  field,
  label,
  optionalLabel,
  countryLabel,
  autoComplete = "tel",
  defaultCountry = "IE",
}: {
  field: FieldProps;
  label: string;
  optionalLabel?: string;
  /** Accessible name of the country select. */
  countryLabel: string;
  autoComplete?: string;
  /** Selected until the visitor picks another country or types an international number. */
  defaultCountry?: CountryCode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { register, change, blur, focus } = useControl({
    defaultValue: field.defaultValue,
    onFocus: () => input.current?.focus(),
  });
  const [{ country, text }, setState] = useState(() => initial(field.defaultValue, defaultCountry));
  const caretFromEnd = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caretFromEnd.current === null || !input.current) return;
    const at = caretWithDigitsAfter(text, caretFromEnd.current);
    input.current.setSelectionRange(at, at);
    caretFromEnd.current = null;
  }, [text]);

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    const named = getCountries()
      .map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      pinned: PINNED.map((code) => named.find((c) => c.code === code)!),
      all: named.filter((c) => !PINNED.includes(c.code)),
    };
  }, []);

  function update(raw: string, selected: CountryCode, caret?: number) {
    const next = interpret(raw, selected);
    if (caret !== undefined) caretFromEnd.current = digitsIn(raw.slice(caret));
    setState({ country: next.country, text: next.shown });
    change(next.e164);
  }

  const Flag = FLAGS[country];
  const option = ({ code, name }: { code: CountryCode; name: string }) => (
    <option key={code} value={code}>
      {name} (+{callingCode(code)})
    </option>
  );

  return (
    <FieldFrame field={field} label={label} optionalLabel={optionalLabel}>
      <BaseControl name={field.name} ref={register} defaultValue={field.defaultValue} />
      <div
        className={cn(
          controlClass,
          "composite-field flex items-center py-0 pr-4 pl-3",
          field.errors ? "border-accent" : "border-line",
        )}
      >
        <div className="relative mr-3 flex shrink-0 items-center gap-1.5">
          <select
            aria-label={countryLabel}
            value={country}
            onChange={(event) => update(text, event.target.value as CountryCode)}
            onBlur={() => blur()}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            {countries.pinned.map(option)}
            <option disabled>──────────</option>
            {countries.all.map(option)}
          </select>
          {Flag && <Flag aria-hidden className="h-4 w-6 rounded-[2px] ring-1 ring-line" />}
          {chevron}
        </div>
        <span className="mr-3 cursor-default border-r border-line pr-3 text-fg-muted select-none">+{callingCode(country)}</span>
        <input
          ref={input}
          id={field.id}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          aria-invalid={field.ariaInvalid}
          aria-describedby={field.ariaDescribedBy}
          placeholder={SAMPLE[country]}
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update(event.target.value, country, event.target.selectionStart ?? undefined)
          }
          onFocus={() => focus()}
          onBlur={() => blur()}
          className={cn("min-w-0 flex-1 bg-transparent py-3 outline-none", placeholderClass)}
        />
      </div>
    </FieldFrame>
  );
}
