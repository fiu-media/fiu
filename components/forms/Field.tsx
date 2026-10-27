import type { ReactNode } from "react";
import type { FormErrorCode } from "@/lib/forms/state";

type Props = {
  name: string;
  label: string;
  /** Localised error message for this field, if any. */
  error?: string;
  /** Shown after the label for fields that aren't required, e.g. "optional". */
  optionalLabel?: string;
  as?: "input" | "textarea" | "select";
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  rows?: number;
  min?: string;
  children?: ReactNode;
};

export const fieldId = (name: string) => `field-${name}`;

const control =
  "w-full rounded-2xl border bg-bg-raised px-4 py-3 text-base text-fg placeholder:text-fg-muted/70 aria-[invalid=true]:border-accent";

export function Field({
  name,
  label,
  error,
  optionalLabel,
  as = "input",
  type = "text",
  defaultValue,
  value,
  onChange,
  autoComplete,
  required,
  rows = 5,
  min,
  children,
}: Props) {
  const id = fieldId(name);
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    required,
    autoComplete,
    className: `${control} ${error ? "border-accent" : "border-line"}`,
  } as const;
  // Controlled (value + onChange) or uncontrolled (defaultValue), never both.
  const binding =
    value !== undefined
      ? { value, onChange: (event: { target: { value: string } }) => onChange?.(event.target.value) }
      : { defaultValue };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {!required && optionalLabel && <span className="ml-1.5 font-normal text-fg-muted">({optionalLabel})</span>}
      </label>
      {as === "textarea" ? (
        <textarea {...shared} {...binding} rows={rows} />
      ) : as === "select" ? (
        <select {...shared} {...binding}>
          {children}
        </select>
      ) : (
        <input {...shared} {...binding} type={type} min={min} />
      )}
      {error && (
        <p id={errorId} className="text-sm text-accent">
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

export type ErrorMessages = Record<FormErrorCode, string>;
