import { TALENT_PROJECTS_QUERY } from "@/content/project";
import { getSiteSettings } from "@/content/siteSettings";
import { TALENT_PROFILE_QUERY, TALENT_QUERY, toProfileMeta, toRosterItems, toTalentProfile } from "@/content/talent";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fetchContent } from "@/sanity/lib/fetch";
import { publishedId } from "@/sanity/lib/image";

import type { IndexItem } from "./components/NameIndex";

/** The roster as index rows. Follows draft mode, so it must sit behind a Suspense boundary. */
export async function getRoster(lang: Locale): Promise<IndexItem[]> {
  return toRosterItems(await fetchContent(TALENT_QUERY, lang), lang);
}

/** One person's page, or `null` when there is no such person. The profile comes first because it names the person to look up projects for. */
export async function getTalentProfile(lang: Locale, slug: string) {
  const profile = await fetchContent(TALENT_PROFILE_QUERY, lang, { slug });
  if (!profile) return null;
  const projects = await fetchContent(TALENT_PROJECTS_QUERY, lang, { talentId: publishedId(profile.talentId) });
  return toTalentProfile(profile, projects);
}

/** Title and description of the roster page. Published content only, so the page's shell stays static. */
export async function getTalentMeta(lang: Locale) {
  const [{ talent }, { talentIntro }] = await Promise.all([getDictionary(lang), getSiteSettings(lang, { draft: false })]);
  return { title: talent.title, description: talentIntro ?? undefined };
}

/** Title and description of a person's page, or `null` when there is no such person. Shares the page's cached fetch. */
export async function getProfileMeta(lang: Locale, slug: string) {
  const profile = await fetchContent(TALENT_PROFILE_QUERY, lang, { slug });
  return profile ? toProfileMeta(profile) : null;
}
