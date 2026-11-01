import "server-only";
import { checkBotId } from "botid/server";
import type { z } from "zod";
import { toErrorCode, type FormState } from "./state";

type Guarded<T> = { ok: true; data: T } | { ok: false; state: FormState };

/** Plain-text fields of a submission, returned to the form so it can repopulate. */
function textValues(raw: Record<string, unknown>) {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && key !== "website" && key !== "submissionId" && key !== "lang") values[key] = value;
  }
  return values;
}

/** Read every text field of a FormData as a string (missing fields become ""), skipping React's `$ACTION_*` plumbing. */
export function formDataToRecord(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) raw[key] = value;
  }
  return raw;
}

/**
 * The shared front door for public forms: bots and filled honeypots are rejected without
 * touching Sanity or Resend; everything else is validated and returned as typed data.
 */
export async function guardSubmission<S extends z.ZodType>(
  schema: S,
  raw: Record<string, unknown>,
): Promise<Guarded<z.output<S>>> {
  const reject: Guarded<never> = { ok: false, state: { status: "error", error: "rejected", values: textValues(raw) } };

  // E2E_BYPASS_BOTID is set only by the Playwright web server: a production build can't reach BotID
  // without Vercel's OIDC token, so the e2e run treats every visitor as human.
  const verification = await checkBotId(
    process.env.E2E_BYPASS_BOTID === "1" ? { developmentOptions: { isDevelopment: true } } : undefined,
  );
  if (verification.isBot) return reject;
  if (typeof raw.website === "string" && raw.website.trim() !== "") return reject;

  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };

  const fieldErrors: NonNullable<FormState["fieldErrors"]> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in fieldErrors)) fieldErrors[key] = toErrorCode(issue.message);
  }
  // Anything without a field to hang it on (e.g. a malformed hidden input) is a generic failure.
  const error = Object.keys(fieldErrors).length === 0 ? "invalid" : undefined;
  return { ok: false, state: { status: "error", fieldErrors, error, values: textValues(raw) } };
}
