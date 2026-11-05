"use client";

import { createContext, use, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toErrorCode, type FormErrorCode } from "@/lib/forms/state";
import { useAutoGrow } from "./useAutoGrow";

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
  /** A textarea starts this many lines tall, grows with what is typed, and scrolls past `maxRows`. */
  minRows?: number;
  maxRows?: number;
  min?: string;
  /** Stops typing and pasting past the limit the schema enforces. */
  maxLength?: number;
  /** An example of what to type, not a repeat of the label. Every text field has one. */
  placeholder?: string;
  children?: ReactNode;
};

/**
 * How every placeholder looks: an example of what to type, muted. The browser's own placeholders (an empty date's
 * "dd/mm/yyyy") are given the same colour, so the form doesn't show two different greys.
 */
export const placeholderClass = "placeholder:text-fg-muted/70";
const emptyDateClass = "[&[data-empty]:not(:focus)]:text-fg-muted/70";

/** The down chevron on every control that opens a list: the select and the phone's country. */
export const chevron = <span aria-hidden className="size-1.5 -translate-y-px rotate-45 border-r border-b border-fg/50" />;

export const controlClass = `w-full rounded-2xl border bg-bg-raised px-4 py-3 text-base text-fg aria-[invalid=true]:border-accent ${placeholderClass}`;

/** The label above a control and the localised error below it; the control itself is the caller's. */
export function FieldFrame({
  field,
  label,
  optionalLabel,
  required,
  children,
}: Pick<Props, "field" | "label" | "optionalLabel" | "required" | "children">) {
  const messages = use(FormMessages)!;
  const error = errorMessage(messages, field.errors);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium">
        {label}
        {!required && optionalLabel && <span className="ml-1.5 font-normal text-fg-muted">({optionalLabel})</span>}
      </label>
      {children}
      {error && (
        <p id={field.errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

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
  minRows = 3,
  maxRows = 12,
  min,
  maxLength,
  placeholder,
  children,
}: Props) {
  const messages = use(FormMessages)!;
  const error = errorMessage(messages, field.errors);
  // A date needs about 11 characters, so on a phone two fit side by side if the padding is trimmed.
  const className = cn(
    controlClass,
    error ? "border-accent" : "border-line",
    type === "date" && cn("min-w-0 px-3 sm:px-4", emptyDateClass),
  );
  const shared = {
    id: field.id,
    name: field.name,
    "aria-invalid": field.ariaInvalid,
    "aria-describedby": field.ariaDescribedBy,
    required,
    autoComplete,
    maxLength,
    placeholder,
    className,
  };
  const textarea = useRef<HTMLTextAreaElement>(null);
  useAutoGrow(textarea);
  // Heights are in lines (`lh`) plus the padding and border, and never more than 60% of the screen: on a phone, with the
  // keyboard up, a tall box would leave no room to see what is being typed.
  const sizes = {
    "--min": `min(calc(${minRows}lh + 1.5rem + 2px), 60dvh)`,
    "--max": `min(calc(${maxRows}lh + 1.5rem + 2px), 60dvh)`,
  };
  const control =
    as === "textarea" ? (
      <textarea
        ref={textarea}
        {...shared}
        // `resize-y`: the handle moves the bottom edge only, not the width, which the form's layout sets.
        className={cn(className, "field-sizing-content max-h-(--max) min-h-(--min) resize-y")}
        style={sizes as CSSProperties}
        defaultValue={field.defaultValue}
        rows={minRows}
      />
    ) : as === "select" ? (
      // The browser's own arrow is swapped for the chevron the other pickers use, in the same place as the combobox's.
      <div className="relative">
        <select {...shared} className={cn(className, "cursor-pointer appearance-none pr-10")} defaultValue={field.defaultValue}>
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 grid w-8 place-items-center">{chevron}</span>
      </div>
    ) : (
      // Controlled (value + onChange) or uncontrolled (Conform's defaultValue), never both.
      <input
        {...shared}
        type={type}
        min={min}
        data-empty={type === "date" && !value ? "" : undefined}
        {...(value === undefined
          ? { defaultValue: field.defaultValue }
          : { value, onChange: (event) => onChange?.(event.target.value) })}
      />
    );

  return (
    <FieldFrame field={field} label={label} optionalLabel={optionalLabel} required={required}>
      {control}
    </FieldFrame>
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
