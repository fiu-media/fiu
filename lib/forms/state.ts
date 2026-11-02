import type { SubmissionResult } from "@conform-to/react/future";

/** Error codes the server returns; the client maps them to localised copy (`dict.forms.errors`). */
export type FormErrorCode =
  "required" | "invalid" | "empty" | "beforeStart" | "past" | "overLimit" | "unavailable" | "rejected" | "failed";

/**
 * What a form action returns: Conform's result (error codes per field and for the form, plus the
 * submitted values so the form repopulates), flagged `success` once the request went through, or
 * `null` before the first submit.
 */
export type FormState = (SubmissionResult<string[]> & { success?: boolean }) | null;

const codes: readonly string[] = [
  "required",
  "invalid",
  "empty",
  "beforeStart",
  "past",
  "overLimit",
  "unavailable",
  "rejected",
  "failed",
] satisfies FormErrorCode[];

export const toErrorCode = (message: string): FormErrorCode => (codes.includes(message) ? (message as FormErrorCode) : "invalid");
