"use client";

import { type DefaultValue, useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { type SubmitEvent, useActionState, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { z } from "zod";

import type { FormState } from "@/lib/forms/state";

const noSubscription = () => () => {};

type Options<Schema extends z.ZodType<unknown, Record<string, unknown>>> = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  /** The same schema the action parses with, so the browser and the server agree. */
  schema: Schema;
  defaultValue?: DefaultValue<z.input<Schema>>;
};

/**
 * Wires a server action and its zod schema to Conform, validating the way people expect ("reward early, punish late"):
 *
 * 1. While someone types in a field for the first time, nothing is shown. An email isn't "invalid" after one character.
 * 2. When they leave the field, it is checked and any error shows inline.
 * 3. Once a field has an error, it is checked as they type, so the error goes the moment the input is valid. A field that
 *    is fine stays quiet while it is edited, and is checked again when they leave it.
 * 4. On submit, everything is checked, including fields never touched; the error summary takes focus and is announced.
 *
 * It also repopulates from the server's reply, and gives each submit a stable id so a retry after a failure is
 * recognised as the same request.
 */
export function useConformForm<Schema extends z.ZodType<unknown, Record<string, unknown>>>({
  action,
  schema,
  defaultValue,
}: Options<Schema>) {
  const [state, formAction, pending] = useActionState(action, null);
  // What the input handler needs from the form, which it is created before (see the effect below).
  const live = useRef<{ hasError: (name: string) => boolean; validate: (name: string) => void }>(null);
  const { form, fields, intent } = useForm(coerceFormValue(schema), {
    lastResult: state,
    defaultValue,
    // Rules 1 and 2: a field is first checked when it is left. Conform's own revalidation is left on blur too, since
    // it would re-check every field that has been left, not only the ones showing an error.
    shouldValidate: "onBlur",
    shouldRevalidate: "onBlur",
    // Rule 3: only a field that is showing an error is re-checked while typing.
    onInput: (event) => {
      const name = event.target.name;
      if (name && live.current?.hasError(name)) live.current.validate(name);
    },
    // The error summary takes focus; Conform would otherwise jump to the first invalid field.
    onError: () => {},
  });
  useEffect(() => {
    live.current = {
      hasError: (name) => (form.fieldErrors[name]?.length ?? 0) > 0,
      validate: (name) => intent.validate(name),
    };
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
      onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
        // Conform also submits hidden "intent" buttons to validate a field on blur; those aren't attempts.
        const submitter = event.nativeEvent.submitter;
        if (submitter?.getAttribute("name") !== form.intentName) setSubmits((count) => count + 1);
        onSubmit(event);
      },
    },
  };
}

export type ConformForm = ReturnType<typeof useConformForm>;
