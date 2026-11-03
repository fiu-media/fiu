"use client";

import { use } from "react";
import { errorMessage, FormMessages, type FieldProps } from "./Field";

/** `id` is what the form submits; `slug` is what a link uses to preselect them. */
export type TalentOption = { id: string; name: string; slug: string };

type Props = {
  /** The `talent` field; its name is shared by every checkbox, so the form submits one entry per pick. */
  field: FieldProps & { defaultOptions: string[] };
  legend: string;
  optionalLabel: string;
  options: TalentOption[];
};

/**
 * A multi-select: every person on the roster as a toggle, any number of them on. A group of checkboxes (so it
 * works with the keyboard and screen readers, and without JavaScript) drawn as pills, filled once chosen.
 */
export function TalentPicker({ field, legend, optionalLabel, options }: Props) {
  const messages = use(FormMessages)!;
  const error = errorMessage(messages, field.errors);
  if (options.length === 0) return null;

  return (
    <fieldset aria-describedby={field.ariaDescribedBy} className="flex min-w-0 flex-col gap-2">
      <legend id={field.id} className="mb-1 text-sm font-medium">
        {legend}
        <span className="ml-1.5 font-normal text-fg-muted">({optionalLabel})</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ id, name }) => (
          <label key={id} className="cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              value={id}
              defaultChecked={field.defaultOptions.includes(id)}
              className="peer sr-only"
            />
            <span className="inline-flex items-center rounded-full border border-line bg-bg-raised px-4 py-2 text-sm text-fg transition-colors peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-(--focus) hover:border-fg/50">
              {name}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={field.errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </fieldset>
  );
}
