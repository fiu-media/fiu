"use client";

import { BaseControl, useControl } from "@conform-to/react/future";
import { getCountryCallingCode } from "libphonenumber-js/min";
import { forwardRef, useRef, useState, type InputHTMLAttributes } from "react";
import PhoneInput, { type Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/cn";
import { controlClass, FieldFrame, type FieldProps } from "./Field";

/** What an example looks like, in the national format the input uses. Countries without one show no placeholder. */
const SAMPLE: Partial<Record<Country, string>> = { IE: "(83) 123 4567" };

type NumberInputProps = InputHTMLAttributes<HTMLInputElement> & { callingCode?: string };

/**
 * The number input, with the country's dialling code in front of it as plain text. The code follows the
 * country select and can't be edited, which the muted, divided look says; the input holds the national number only.
 */
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { callingCode, className, ...props },
  ref,
) {
  return (
    <div className={cn(className, "flex min-w-0 items-center")}>
      {callingCode && (
        <span className="mr-3 cursor-default border-r border-line pr-3 text-fg-muted select-none">+{callingCode}</span>
      )}
      <input ref={ref} {...props} className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-fg-muted/70" />
    </div>
  );
});

/**
 * A phone number with a country select (flag, then the name and dialling code in the list) and a number
 * input that formats as you type, built on libphonenumber-js. What the form submits is one E.164 value
 * ("+353871234567"), through a hidden control that Conform watches, so validation and error focus work
 * like any field.
 */
export function PhoneField({
  field,
  label,
  optionalLabel,
  autoComplete = "tel",
  defaultCountry = "IE",
}: {
  field: FieldProps;
  label: string;
  optionalLabel?: string;
  autoComplete?: string;
  /** Selected until the visitor picks another country or types an international number. */
  defaultCountry?: Country;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { register, change, blur, focus } = useControl({
    defaultValue: field.defaultValue,
    onFocus: () => input.current?.focus(),
  });
  // The number input is controlled by this state; the control only carries the value into the form
  // (and its change and blur events, which is what makes Conform validate).
  const [value, setValue] = useState(field.defaultValue || undefined);
  const [country, setCountry] = useState<Country | undefined>(defaultCountry);

  return (
    <FieldFrame field={field} label={label} optionalLabel={optionalLabel}>
      <BaseControl name={field.name} ref={register} defaultValue={field.defaultValue} />
      <PhoneInput
        flags={flags}
        defaultCountry={defaultCountry}
        addInternationalOption={false}
        inputComponent={NumberInput}
        numberInputProps={{ callingCode: country && getCountryCallingCode(country) } as object}
        placeholder={country && SAMPLE[country]}
        value={value}
        onChange={(next) => {
          setValue(next);
          change(next ?? "");
        }}
        onCountryChange={setCountry}
        onBlur={() => blur()}
        onFocus={() => focus()}
        inputRef={input}
        id={field.id}
        autoComplete={autoComplete}
        aria-invalid={field.ariaInvalid}
        aria-describedby={field.ariaDescribedBy}
        className={cn(
          controlClass,
          "phone-field flex items-center gap-3 py-0 pl-3",
          field.errors ? "border-accent" : "border-line",
        )}
      />
    </FieldFrame>
  );
}
