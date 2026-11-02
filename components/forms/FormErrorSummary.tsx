"use client";

import { useEffect, useRef } from "react";
import { errorMessage, type ErrorMessages } from "./Field";
import type { ConformForm } from "./useConformForm";

/** Field names with their visible labels, in the order they appear on the page. */
export type SummaryLabels = readonly (readonly [name: string, label: string])[];

/**
 * Announced and focused when a submission fails, so keyboard and screen-reader users land on
 * what went wrong, with links down to each field.
 */
export function FormErrorSummary({
  form,
  labels,
  title,
  messages,
  attempt,
}: {
  form: ConformForm["form"];
  labels: SummaryLabels;
  title: string;
  messages: ErrorMessages;
  /** Changes on every submit and server reply so focus moves even when the errors are identical. */
  attempt: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Conform focuses the first invalid field when it learns of errors; wait a frame so the summary wins.
    const frame = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [attempt]);

  const items = labels.flatMap(([name, label]) => {
    const message = errorMessage(messages, form.allErrors[name]);
    return message ? [{ name, label, message }] : [];
  });
  const formMessage = errorMessage(messages, form.errors);

  if (items.length === 0 && !formMessage) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-2xl border border-accent bg-bg-raised p-4 text-sm focus:outline-offset-2"
    >
      {items.length > 0 && (
        <>
          <p className="font-semibold">{title}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {items.map((item) => (
              <li key={item.name}>
                <a href={`#${form.id}-${item.name}`} className="underline underline-offset-2">
                  {item.label}
                </a>
                : {item.message}
              </li>
            ))}
          </ul>
        </>
      )}
      {formMessage && <p className={items.length > 0 ? "mt-2" : undefined}>{formMessage}</p>}
    </div>
  );
}
