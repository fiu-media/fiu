import "server-only";
import { parseSubmission, report, type FormError, type SubmissionResult } from "@conform-to/react/future";
import { coerceFormValue, formatResult } from "@conform-to/zod/v4/future";
import { checkBotId } from "botid/server";
import type { z } from "zod";
import { env } from "@/env";
import { toErrorCode, type FormState } from "./state";

/** Errors a caller can add on top of the schema's: for the whole form, or for named fields. */
type Errors = { formErrors?: string[]; fieldErrors?: Record<string, string[]> };

type Guarded<T> =
  { ok: true; data: T; fail: (errors: Errors) => FormState; succeed: () => FormState } | { ok: false; result: FormState };

/** Zod's own wording (e.g. "Invalid input: expected string") has no place on the wire: only our error codes. */
function withCodes(error: FormError<string[]>): FormError<string[]> {
  return {
    formErrors: error.formErrors?.map(toErrorCode) ?? null,
    fieldErrors: Object.fromEntries(
      Object.entries(error.fieldErrors).map(([name, codes]) => [name, codes?.map(toErrorCode) ?? null]),
    ),
  };
}

/**
 * The shared front door for public forms: bots and filled honeypots are rejected without
 * touching Sanity or Resend; everything else is validated and returned as typed data. `fail`
 * answers with the submitted values, so a form-level or server-only failure repopulates the form.
 */
export async function guardSubmission<S extends z.ZodType>(schema: S, formData: FormData): Promise<Guarded<z.output<S>>> {
  const submission = parseSubmission(formData, { skipEntry: (name) => name.startsWith("$ACTION") });
  // Read before any reply: hiding a field clears it from the submission itself.
  const honeypot = submission.payload.website;
  // Replies echo every submitted field, honeypot included: Conform keeps a server error only while the
  // form still holds what the server saw, so leaving a field out would let the first blur wipe the error.
  const reply = (
    error: FormError<string[]> | null,
    options: { reset?: boolean; hideFields?: string[] } = {},
  ): SubmissionResult<string[]> => report(submission, { error, ...options });
  const fail = (errors: Errors): FormState =>
    reply({ formErrors: errors.formErrors ?? null, fieldErrors: errors.fieldErrors ?? {} });
  // A filled honeypot is the one thing never echoed back.
  const rejected = () =>
    ({
      ok: false,
      result: reply({ formErrors: ["rejected"], fieldErrors: {} }, { hideFields: ["website"] }),
    }) as const;

  // E2E_BYPASS_BOTID is set only by the Playwright web server: a production build can't reach BotID
  // without Vercel's OIDC token, so the e2e run treats every visitor as human.
  const verification = await checkBotId(
    env.E2E_BYPASS_BOTID === "1" ? { developmentOptions: { isDevelopment: true } } : undefined,
  );
  if (verification.isBot) return rejected();
  if (typeof honeypot === "string" && honeypot.trim() !== "") return rejected();

  const parsed = coerceFormValue(schema).safeParse(submission.payload);
  if (!parsed.success) {
    const error = formatResult(parsed);
    return { ok: false, result: reply(error && withCodes(error)) };
  }
  return { ok: true, data: parsed.data, fail, succeed: () => ({ ...reply(null, { reset: true }), success: true }) };
}
