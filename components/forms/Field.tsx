"use client";

import { createContext, use, type ReactNode } from "react";
import { toErrorCode, type FormErrorCode } from "@/lib/forms/state";

export type ErrorMessages = Record<FormErrorCode, string>;

/** Localised copy for the error codes in a form, provided once by `<Form>`. */
export const FormMessages = createContext<ErrorMessages | null>(null);

/** The first localised message for a Conform field's error codes. */
export function errorMessage(messages: ErrorMessages, errors?: string[]) {
  return errors?.[0] === undefined ? undefined : messages[toErrorCode(errors[0])];
}

/** The parts of Conform's field metadata a control needs. */
export type FieldProps = {
  id: string;
  name: string;
  defaultValue: string;
  errorId: string;
  errors: string[] | undefined;
  ariaInvalid: boolean | undefined;
  ariaDescribedBy: string | undefined;
};

type Props = {
  field: FieldProps;
  label: string;
  /** Shown after the label for fields that aren't required, e.g. "optional". */
  optionalLabel?: string;
  as?: "input" | "textarea" | "select";
  type?: "text" | "email" | "tel" | "date";
  /** Controlled value (with `onChange`); leave both out to let the form own the value. */
  value?: string;
  onChange?: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  rows?: number;
  min?: string;
  children?: ReactNode;
};

const controlClass =
  "w-full rounded-2xl border bg-bg-raised px-4 py-3 text-base text-fg placeholder:text-fg-muted/70 aria-[invalid=true]:border-accent";

export function Field({
  field,
  label,
  optionalLabel,
  as = "input",
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  rows = 5,
  min,
  children,
}: Props) {
  const messages = use(FormMessages)!;
  const error = errorMessage(messages, field.errors);
  const className = `${controlClass} ${error ? "border-accent" : "border-line"}`;
  const shared = {
    id: field.id,
    name: field.name,
    "aria-invalid": field.ariaInvalid,
    "aria-describedby": field.ariaDescribedBy,
    required,
    autoComplete,
    className,
  };
  const control =
    as === "textarea" ? (
      <textarea {...shared} defaultValue={field.defaultValue} rows={rows} />
    ) : as === "select" ? (
      <select {...shared} defaultValue={field.defaultValue}>
        {children}
      </select>
    ) : (
      // Controlled (value + onChange) or uncontrolled (Conform's defaultValue), never both.
      <input
        {...shared}
        type={type}
        min={min}
        {...(value === undefined
          ? { defaultValue: field.defaultValue }
          : { value, onChange: (event) => onChange?.(event.target.value) })}
      />
    );

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium">
        {label}
        {!required && optionalLabel && <span className="ml-1.5 font-normal text-fg-muted">({optionalLabel})</span>}
      </label>
      {control}
      {error && (
        <p id={field.errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

/** Hidden from people and assistive tech; bots tend to fill it, and the server rejects them for it. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
