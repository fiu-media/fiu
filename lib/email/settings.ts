import "server-only";

import { SUBMISSION_SETTINGS_QUERY } from "@/content/siteSettings";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { writeClient } from "@/sanity/lib/writeClient";

/**
 * Where notification emails go: the addresses editors set in Site settings.
 * Read uncached so a changed address applies to the next submission.
 */
export async function getRecipient(kind: "quote" | "contact", lang: Locale): Promise<string | null> {
  const settings = await writeClient.fetch(SUBMISSION_SETTINGS_QUERY, { lang, fallbackLang: defaultLocale }).catch(() => null);
  const fromSettings =
    kind === "quote"
      ? (settings?.quoteRecipient ?? settings?.contactEmail)
      : (settings?.contactEmail ?? settings?.quoteRecipient);
  return fromSettings || null;
}
