import { PROJECT_ORDER_QUERY, PROJECT_QUERY, toProject, toProjectMeta, toWorkIndex, WORK_QUERY } from "@/content/project";
import { getSiteSettings } from "@/content/siteSettings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fetchContent } from "@/sanity/lib/fetch";

/** Our Work: the type filters and the slides for `?type=`. Follows draft mode, so it must sit behind a Suspense boundary. */
export async function getWorkIndex(lang: Locale, requestedType: string | null | undefined) {
  return toWorkIndex(await fetchContent(WORK_QUERY, lang), lang, requestedType);
}

/** One project's page, or `null` when there is no such project. Follows draft mode like the index. */
export async function getProject(lang: Locale, slug: string) {
  const [project, order] = await Promise.all([
    fetchContent(PROJECT_QUERY, lang, { slug }),
    fetchContent(PROJECT_ORDER_QUERY, lang),
  ]);
  return project ? toProject(project, order, lang) : null;
}

/** Title and description of Our Work. Published content only, so the page's shell stays static. */
export async function getWorkMeta(lang: Locale) {
  const [{ work }, { workIntro }] = await Promise.all([getDictionary(lang), getSiteSettings(lang, { draft: false })]);
  return { title: work.title, description: workIntro ?? undefined };
}

/** Title and description of a project's page, or `null` when there is no such project. Shares the page's cached fetch. */
export async function getProjectMeta(lang: Locale, slug: string) {
  const project = await fetchContent(PROJECT_QUERY, lang, { slug });
  return project ? toProjectMeta(project) : null;
}
