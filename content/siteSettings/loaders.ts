import { emailForDisplay } from "@/lib/email/display";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { instagramHandle } from "@/lib/instagram";
import type { SITE_SETTINGS_QUERY_RESULT } from "@/sanity.types";
import { fetchContent } from "@/sanity/lib/fetch";

import { SITE_SETTINGS_QUERY } from "./queries";

/** How the studio can be reached, ready to render: the email as visitors read it, Instagram with its `@handle`. */
export type SiteContact = {
  /** Already run through `emailForDisplay`, so the text and the `mailto:` link are the same. */
  email: string | null;
  instagram: { href: string; handle: string } | null;
};

/** Site settings as pages use them: the query's fields, with the two contact fields folded into `contact`. */
export type SiteSettings = Omit<SITE_SETTINGS_QUERY_RESULT, "contactEmail" | "instagram" | "fallbackFields"> & {
  contact: SiteContact;
  /** The language of each text field that fell back to the default language's, for its `lang` attribute. Fields in the page's own language are absent. */
  fallbackLang: Partial<Record<keyof SITE_SETTINGS_QUERY_RESULT, Locale>>;
};

/** The query's result as a view model. Kept apart from the fetch so it can be tested without the cache boundary. */
export function toSiteSettings({ contactEmail, instagram, fallbackFields, ...rest }: SITE_SETTINGS_QUERY_RESULT): SiteSettings {
  return {
    ...rest,
    fallbackLang: Object.fromEntries(fallbackFields.map((field) => [field, defaultLocale])),
    contact: {
      email: contactEmail ? emailForDisplay(contactEmail) : null,
      instagram: instagram ? { href: instagram, handle: instagramHandle(instagram) } : null,
    },
  };
}

/**
 * Site settings in `lang`, each field falling back to the default language's. `draft: false` reads published
 * content only, for pages that should stay static.
 */
export async function getSiteSettings(lang: Locale, { draft = true }: { draft?: boolean } = {}): Promise<SiteSettings> {
  return toSiteSettings(await fetchContent(SITE_SETTINGS_QUERY, lang, {}, { draft }));
}
