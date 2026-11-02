"use client";

import { getFormProps, useForm, type FormMetadata } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { startTransition, useActionState, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { z } from "zod";
import type { FormState } from "@/lib/forms/state";

/** The name Conform gives its hidden validation buttons. */
const INTENT = "__intent__";

const noSubscription = () => () => {};

type Options<S extends z.ZodType> = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  /** The same schema the action parses with, so the browser and the server agree. */
  schema: S;
  defaultValue?: Record<string, string>;
};

/**
 * Wires a server action and its zod schema to Conform: validate each field on blur and then as it is edited,
 * repopulate from the server's reply, and give each submit a stable id so a retry after a failure is
 * recognised as the same request.
 */
export function useConformForm<S extends z.ZodType>({ action, schema, defaultValue }: Options<S>) {
  const [lastResult, formAction, pending] = useActionState(action, null);
  const [form, fields] = useForm({
    lastResult,
    defaultValue,
    // Without JavaScript the browser's own required/type checks stay on.
    defaultNoValidate: false,
    shouldValidate: "onBlur",
    // Once shown, errors update as the visitor edits. Revalidating on blur instead would let moving focus
    // to the error summary wipe any error only the server knows about (it re-runs just the shared schema).
    shouldRevalidate: "onInput",
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
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
  const attempt = useMemo(() => ({ submits, lastResult }), [submits, lastResult]);

  const { onSubmit, ...formProps } = getFormProps(form);
  return {
    form: form as FormMetadata,
    fields,
    pending,
    attempt,
    submissionId,
    succeeded: lastResult?.status === "success",
    /** True once the visitor has tried to submit, so the summary doesn't appear for a lone blur. */
    attempted: submits > 0 || lastResult?.status === "error",
    formProps: {
      ...formProps,
      action: formAction,
      onSubmit: (event: FormEvent<HTMLFormElement>) => {
        // Conform also submits hidden "intent" buttons to validate a field on blur; those aren't attempts.
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter?.getAttribute("name") !== INTENT) setSubmits((count) => count + 1);
        // Conform validates, and cancels the submit when the form is invalid (or it was only a blur check).
        onSubmit(event);
        if (event.defaultPrevented) return;
        // Run the action ourselves rather than let React do it: React resets the form once an action
        // finishes, which Conform takes for a reset and answers by forgetting the server's reply.
        // Without JavaScript the `action` attribute still posts the form natively.
        event.preventDefault();
        const formData = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(formData));
      },
    },
  };
}

export type ConformForm = ReturnType<typeof useConformForm>;
