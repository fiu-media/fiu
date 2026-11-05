"use client";

import type { ReactNode } from "react";
import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { FormMessages, Honeypot } from "./Field";
import { FormErrorSummary, type SummaryLabels } from "./FormErrorSummary";
import type { ConformForm } from "./useConformForm";

/**
 * The shared shell of a public form: the hidden locale and submission id, the honeypot, the error
 * summary, and the localised error copy its `<Field>`s read.
 */
export function Form({
  conform,
  lang,
  forms,
  labels,
  className,
  children,
}: {
  conform: ConformForm;
  lang: Locale;
  forms: Dictionary["forms"];
  labels: SummaryLabels;
  className?: string;
  children: ReactNode;
}) {
  const { form, formProps, submissionId, attempt, attempted } = conform;
  return (
    <FormMessages value={forms.errors}>
      <form {...formProps} className={cn("relative flex flex-col", className)}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="submissionId" value={submissionId} />
        <Honeypot />
        {attempted && (
          <FormErrorSummary form={form} labels={labels} title={forms.errorSummary} messages={forms.errors} attempt={attempt} />
        )}
        {children}
      </form>
    </FormMessages>
  );
}

/**
 * The submit button. Pressing it with the mouse doesn't move focus off the field being filled in, so
 * that field's blur check can't insert an error message and shift the button out from under the click.
 */
export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <GlassPillButton
      type="submit"
      size="lg"
      disabled={pending}
      aria-disabled={pending}
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </GlassPillButton>
  );
}
