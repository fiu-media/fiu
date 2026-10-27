"use client";

import { useEffect, useRef } from "react";
import { fieldId } from "./Field";

export type SummaryItem = { name: string; label: string; message: string };

/**
 * Announced and focused when a submission fails, so keyboard and screen-reader users land on
 * what went wrong, with links down to each field.
 */
export function FormErrorSummary({
  title,
  items,
  message,
  attempt,
}: {
  title: string;
  items: SummaryItem[];
  /** A form-level error that has no field. */
  message?: string;
  /** Changes on every failed submission so focus moves even when the errors are identical. */
  attempt: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [attempt]);

  if (items.length === 0 && !message) return null;
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
                <a href={`#${fieldId(item.name)}`} className="underline underline-offset-2">
                  {item.label}
                </a>
                : {item.message}
              </li>
            ))}
          </ul>
        </>
      )}
      {message && <p className={items.length > 0 ? "mt-2" : undefined}>{message}</p>}
    </div>
  );
}
