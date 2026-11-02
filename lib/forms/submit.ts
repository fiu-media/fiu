import "server-only";
import type { Submission, SubmissionResult } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { checkBotId } from "botid/server";
import type { z } from "zod";
import { env } from "@/env";
import { toErrorCode } from "./state";

type ReplyOptions = Parameters<Submission<unknown>["reply"]>[0];

type Guarded<T> =
  { ok: true; data: T; reply: (options?: ReplyOptions) => SubmissionResult } | { ok: false; result: SubmissionResult };

/** Zod's own wording (e.g. "Invalid input: expected string") has no place on the wire: only our error codes. */
function withCodes(result: SubmissionResult): SubmissionResult {
  if (!result.error) return result;
  const error = Object.fromEntries(Object.entries(result.error).map(([name, codes]) => [name, codes?.map(toErrorCode) ?? null]));
  return { ...result, error };
}

/**
 * The shared front door for public forms: bots and filled honeypots are rejected without
 * touching Sanity or Resend; everything else is validated and returned as typed data. `reply`
 * answers with the submitted values, so a form-level or server-only failure repopulates the form.
 */
export async function guardSubmission<S extends z.ZodType>(schema: S, formData: FormData): Promise<Guarded<z.output<S>>> {
  const submission = parseWithZod(formData, { schema });
  const reject = { ok: false, result: submission.reply({ formErrors: ["rejected"], hideFields: ["website"] }) } as const;

  // E2E_BYPASS_BOTID is set only by the Playwright web server: a production build can't reach BotID
  // without Vercel's OIDC token, so the e2e run treats every visitor as human.
  const verification = await checkBotId(
    env.E2E_BYPASS_BOTID === "1" ? { developmentOptions: { isDevelopment: true } } : undefined,
  );
  if (verification.isBot) return reject;
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") return reject;

  if (submission.status !== "success") return { ok: false, result: withCodes(submission.reply()) };
  return { ok: true, data: submission.value, reply: submission.reply };
}
