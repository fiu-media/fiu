import "server-only";
import { env } from "@/env";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { writeClient } from "@/sanity/lib/writeClient";
import { SUBMISSION_SETTINGS_QUERY } from "@/sanity/lib/queries";

/**
 * Where notification emails go. Editors set it in Site settings; QUOTE_TO_EMAIL is the fallback.
 * Read uncached so a changed address applies to the next submission.
 */
export async function getRecipient(kind: "quote" | "contact", lang: Locale): Promise<string | null> {
  const settings = await writeClient
    .fetch(SUBMISSION_SETTINGS_QUERY, { lang, fallbackLang: defaultLocale })
    .catch(() => null);
  const fromSettings =
    kind === "quote" ? (settings?.quoteRecipient ?? settings?.contactEmail) : (settings?.contactEmail ?? settings?.quoteRecipient);
  return fromSettings || env.QUOTE_TO_EMAIL || null;
}
