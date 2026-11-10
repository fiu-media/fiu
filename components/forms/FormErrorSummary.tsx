"use client";

import { useEffect, useRef, useState } from "react";

import { errorMessage, type ErrorMessages } from "./Field";
import { inPageOrder, useFormLabels } from "./FormLabels";
import type { ConformForm } from "./useConformForm";

/**
 * Announced and focused when a submission fails, so keyboard and screen-reader users land on
 * what went wrong, with links down to each field.
 */
export function FormErrorSummary({
  form,
  title,
  messages,
  attempt,
}: {
  form: ConformForm["form"];
  title: string;
  messages: ErrorMessages;
  /** Changes on every submit and server reply so focus moves even when the errors are identical. */
  attempt: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The alert is announced once, when the submit fails. Errors then clear as each field is fixed; those changes still
  // show here, but a screen reader isn't made to read the whole list out again every time.
  const [quietFor, setQuietFor] = useState<unknown>(null);
  useEffect(() => {
    ref.current?.focus();
    const timer = setTimeout(() => setQuietFor(attempt), 1000);
    return () => clearTimeout(timer);
  }, [attempt]);

  // Each field registered its own label; they are listed in the order they appear on the page.
  const labels = useFormLabels();
  const items = inPageOrder(labels).flatMap(({ name, label }) => {
    const message = errorMessage(messages, form.fieldErrors[name]);
    return message ? [{ name, label, message }] : [];
  });
  const formMessage = errorMessage(messages, form.errors);

  if (items.length === 0 && !formMessage) return null;
  return (
    <div
      ref={ref}
      role="alert"
      aria-live={quietFor === attempt ? "off" : undefined}
      tabIndex={-1}
      className="rounded-2xl border border-accent bg-bg-raised p-4 text-sm focus:outline-offset-2"
    >
      {items.length > 0 && (
        <>
          <p className="font-semibold">{title}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {items.map((item) => (
              <li key={item.name}>
                <a href={`#${form.getField(item.name).id}`} className="link-inline">
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
