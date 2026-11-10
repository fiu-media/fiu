import "server-only";

import { type FormError, parseSubmission, report, type SubmissionResult } from "@conform-to/react/future";
import { coerceFormValue, formatResult } from "@conform-to/zod/v4/future";
import { checkBotId } from "botid/server";
import type { z } from "zod";

import { env } from "@/env";
import { toDeliverable } from "@/lib/email/address";
import { getRecipient } from "@/lib/email/settings";
import { studioEditUrl } from "@/lib/email/studio-link";
import type { Built } from "@/lib/email/templates";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { writeClient } from "@/sanity/lib/writeClient";

import { isConflict, sendAll } from "./notify";
import { HIDDEN_FIELDS } from "./schemas";
import { type FormErrorCode, type FormState, toErrorCode } from "./state";

/** Errors a caller can add on top of the schema's: for the whole form, or for named fields. */
type Errors = { formErrors?: string[]; fieldErrors?: Record<string, string[]> };

type Guarded<T> =
  | { ok: true; data: T; fail: (errors: Errors) => FormState; succeed: (extra?: { confirmation?: boolean }) => FormState }
  | { ok: false; result: FormState };

/**
 * Zod's own wording (e.g. "Invalid input: expected string") has no place on the wire: only our error
 * codes. A problem with a field the visitor can't see becomes a problem with the whole submission.
 */
function withCodes(error: FormError): FormError {
  const formErrors = new Set(error.formErrors?.map(toErrorCode));
  const fieldErrors: FormError["fieldErrors"] = {};
  for (const [name, codes] of Object.entries(error.fieldErrors)) {
    if (!HIDDEN_FIELDS.includes(name)) fieldErrors[name] = codes?.map(toErrorCode) ?? null;
    else if (codes?.length) formErrors.add("rejected");
  }
  return { formErrors: formErrors.size > 0 ? [...formErrors] : null, fieldErrors };
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
  const reply = (error: FormError | null, options: { reset?: boolean; hideFields?: string[] } = {}): SubmissionResult =>
    report(submission, { error, ...options });
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
  return {
    ok: true,
    data: parsed.data,
    fail,
    succeed: (extra) => ({ ...reply(null, { reset: true }), ...extra, success: true }),
  };
}

/** What every public form submits, besides its own fields. */
type Submitted = { lang: Locale; submissionId: string; email: string };

type EmailContext<D, X> = {
  data: D;
  /** Whatever `validate` worked out along the way (for the quote form, the kit). */
  extra: X;
  /** The visitor's language. */
  dict: Dictionary;
  /** The studio's language: the team's copy is always in the default language. */
  teamDict: Dictionary;
  /** The stored document, in the hosted Studio. */
  studioLink: string;
};

type SubmissionConfig<S extends z.ZodType<Submitted>, X> = {
  schema: S;
  docType: "contactMessage" | "quoteRequest";
  /** Whose address in Site settings gets the notification; also the prefix of what is logged. */
  recipient: "contact" | "quote";
  /** Checks that need the outside world (the quote's availability and limits). Fail with form errors, or carry on with `extra`. */
  validate?: (data: z.output<S>) => Promise<{ formErrors: FormErrorCode[] } | { extra: X }>;
  /** The submission's own fields; the id, type, status and time are added here. */
  toDocument: (data: z.output<S>, extra: X) => Record<string, unknown>;
  emails: (context: EmailContext<z.output<S>, X>) => { notification: Built; confirmation: Built };
  /** Runs alongside the emails, once the submission is stored; like them, it must not fail the submission. */
  after?: (data: z.output<S>) => Promise<void>;
};

/**
 * The pipeline behind every public form: guard, check, store, then tell the studio and the visitor. Storing is
 * idempotent (the document's id comes from the form's `submissionId`), so a double submit succeeds without
 * emailing twice, and nothing after storing can turn a saved submission into an error for the visitor.
 */
export async function handleSubmission<S extends z.ZodType<Submitted>, X = undefined>(
  config: SubmissionConfig<S, X>,
  formData: FormData,
): Promise<FormState> {
  const { schema, docType, recipient, validate, toDocument, emails, after } = config;
  const guarded = await guardSubmission(schema, formData);
  if (!guarded.ok) return guarded.result;
  const { data, fail, succeed } = guarded;

  let extra = undefined as X;
  if (validate) {
    const checked = await validate(data);
    if ("formErrors" in checked) return fail({ formErrors: checked.formErrors });
    extra = checked.extra;
  }

  const id = `${docType}-${data.submissionId}`;
  try {
    // `create` (not createOrReplace) so a retried or double-submitted form can't reset the
    // status an editor has already moved on, and doesn't send the emails twice.
    await writeClient.create({
      ...toDocument(data, extra),
      _id: id,
      _type: docType,
      status: "new",
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isConflict(error)) return succeed();
    console.error(`[${recipient}] could not store submission:`, error);
    return fail({ formErrors: ["failed"] });
  }

  const to = await getRecipient(recipient, data.lang);
  if (!to) console.warn(`[${recipient}] no recipient set in Site settings; skipping notification`);
  const [dict, teamDict] = await Promise.all([getDictionary(data.lang), getDictionary(defaultLocale)]);
  const { notification, confirmation } = emails({ data, extra, dict, teamDict, studioLink: studioEditUrl(id, docType) });
  await Promise.all([
    sendAll([
      to ? { to, replyTo: data.email, ...notification } : null,
      // Replies to the confirmation reach the studio: the sending address has no mailbox.
      { to: data.email, replyTo: to ?? undefined, ...confirmation },
    ]),
    after?.(data),
  ]);

  return succeed({ confirmation: toDeliverable(data.email) !== null });
}
