"use client";

import { useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { useActionState, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { z } from "zod";
import type { FormState } from "@/lib/forms/state";

const noSubscription = () => () => {};

type Options = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  /** The same schema the action parses with, so the browser and the server agree. */
  schema: z.ZodType<unknown, Record<string, unknown>>;
  defaultValue?: Record<string, string>;
};

/**
 * Wires a server action and its zod schema to Conform: validate each field on blur, repopulate from
 * the server's reply, and give each submit a stable id so a retry after a failure is recognised as
 * the same request.
 */
export function useConformForm({ action, schema, defaultValue }: Options) {
  const [state, formAction, pending] = useActionState(action, null);
  const { form, fields } = useForm(coerceFormValue(schema), {
    lastResult: state,
    defaultValue,
    shouldValidate: "onBlur",
    // The error summary takes focus; Conform would otherwise jump to the first invalid field.
    onError: () => {},
  });

  // Created after hydration so it never lands in the server-rendered (and cached) HTML.
  const id = useRef<string>(undefined);
  const submissionId = useSyncExternalStore(
    noSubscription,
    () => (id.current ??= crypto.randomUUID()),
    () => "",
  );

  // Changes on every submit and every server reply, so the error summary takes focus each time.
  const [submits, setSubmits] = useState(0);
  const attempt = useMemo(() => ({ submits, state }), [submits, state]);

  const { onSubmit, ...formProps } = form.props;
  return {
    form,
    fields,
    pending,
    attempt,
    submissionId,
    succeeded: state?.success === true,
    /** False when the request went through but there's no way to email the visitor a confirmation. */
    confirmed: state?.confirmation !== false,
    /** True once the visitor has tried to submit, so the summary doesn't appear for a lone blur. */
    attempted: submits > 0 || (state !== null && !state.success && Boolean(state.error)),
    formProps: {
      ...formProps,
      action: formAction,
      onSubmit: (event: FormEvent<HTMLFormElement>) => {
        // Conform also submits hidden "intent" buttons to validate a field on blur; those aren't attempts.
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter?.getAttribute("name") !== form.intentName) setSubmits((count) => count + 1);
        onSubmit(event);
      },
    },
  };
}

export type ConformForm = ReturnType<typeof useConformForm>;
