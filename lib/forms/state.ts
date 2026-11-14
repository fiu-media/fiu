import type { SubmissionResult } from "@conform-to/react/future";

/** Error codes the server returns; the client maps them to localised copy (`dict.forms.errors`). */
const FORM_ERROR_CODES = [
  "required",
  "invalid",
  "emailInvalid",
  "phoneInvalid",
  "dateInvalid",
  "tooLong",
  "empty",
  "beforeStart",
  "past",
  "tooFar",
  "hireTooLong",
  "overLimit",
  "unavailable",
  "rejected",
  "failed",
] as const;

export type FormErrorCode = (typeof FORM_ERROR_CODES)[number];

/**
 * What a form action returns: Conform's result (error codes per field and for the form, plus the
 * submitted values so the form repopulates), flagged `success` once the request went through (`confirmation: false` when the visitor's address can't be emailed), or
 * `null` before the first submit.
 */
export type FormState = (SubmissionResult & { success?: boolean; confirmation?: boolean }) | null;

export const toErrorCode = (message: string): FormErrorCode => FORM_ERROR_CODES.find((code) => code === message) ?? "invalid";
