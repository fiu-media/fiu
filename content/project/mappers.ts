import { at } from "@/lib/at";
import { selectFilter } from "@/lib/filter";
import type { Locale } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";
import type { PROJECT_ORDER_QUERY_RESULT, PROJECT_QUERY_RESULT, WORK_QUERY_RESULT } from "@/sanity.types";
import { editAttr } from "@/sanity/lib/editing";
import { type QueriedImage, type SizedImage, toSizedImage } from "@/sanity/lib/image";

import type { ProjectSlideProps } from "./components/ProjectSlide";
import type { Still } from "./components/ProjectStills";

/** Image widths (px) the project views ask for. */
export const COVER_WIDTH = 2400;
export const COVER_MOBILE_WIDTH = 1440;
export const STILL_THUMB_WIDTH = 1000;
export const STILL_FULL_WIDTH = 2400;

type Meta = { type: string | null; year: number | null; client: string | null };

/** The project fields a slide shows; every project query returns at least these (see `PROJECT_SLIDE_FIELDS`). */
export type ProjectSlideSource = Meta & {
  _id: string;
  title: string;
  vimeoUrl: string | null;
  previewLoopUrl: string | null;
  cover: { landscape: QueriedImage | null; portrait: QueriedImage | null };
};

/** The line under a project's title: type, year, client, whichever are set. */
export function projectMeta({ type, year, client }: Meta): string {
  return [type, year, client].filter(Boolean).join(" · ");
}

/** The data props of a `ProjectSlide`; the caller adds the rest (label, link, priority, dictionary). */
export type ProjectSlideData = Pick<
  ProjectSlideProps,
  "title" | "meta" | "image" | "mobileImage" | "vimeoUrl" | "previewLoopUrl" | "titleAttribute"
>;

/** A project as the data props of a `ProjectSlide`. */
export function toProjectSlideData(project: ProjectSlideSource): ProjectSlideData {
  return {
    title: project.title,
    meta: projectMeta(project),
    image: project.cover.landscape ? toSizedImage(project.cover.landscape, COVER_WIDTH) : null,
    mobileImage: project.cover.portrait ? toSizedImage(project.cover.portrait, COVER_MOBILE_WIDTH) : null,
    vimeoUrl: project.vimeoUrl,
    previewLoopUrl: project.previewLoopUrl,
    titleAttribute: editAttr("project", project._id, "title"),
  };
}

/** Stills as thumbnail and full-size pairs; one without an image is dropped. */
export function toStills(stills: QueriedImage[] | null | undefined): Still[] {
  return (stills ?? []).flatMap((still) => {
    const thumb: SizedImage | null = toSizedImage(still, STILL_THUMB_WIDTH);
    const full = toSizedImage(still, STILL_FULL_WIDTH);
    return thumb && full ? { thumb, full } : [];
  });
}

/** A project's two sets of stills, landscape and portrait, each as thumbnail and full-size pairs. */
export function toProjectStills({
  landscape,
  portrait,
}: {
  landscape: QueriedImage[] | null | undefined;
  portrait: QueriedImage[] | null | undefined;
}): { landscape: Still[]; portrait: Still[] } {
  return { landscape: toStills(landscape), portrait: toStills(portrait) };
}

/** The text of a block-content field, for a page description. */
export function plainText(blocks: { children?: { text?: string }[] }[] | null | undefined): string {
  return (blocks ?? [])
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .filter(Boolean)
    .join(" ");
}

/** A slide in a list, with what the list needs to key it and link to the project's own page. */
type WorkSlide = ProjectSlideData & { id: string; href?: string | undefined };

/**
 * Our Work: the type filters worth offering, which one is active, and the slides to show. Only types that have projects
 * are offered, and an unknown `?type=` shows everything. No slides means there are no projects at all.
 */
export function toWorkIndex(data: WORK_QUERY_RESULT, lang: Locale, requestedType: string | null | undefined) {
  const { usable, active, visible } = selectFilter(data.types, data.projects, requestedType, {
    idOf: (type) => type.slug,
    groupOf: (project) => project.typeSlug,
  });
  const slides: WorkSlide[] = visible.map((project) => ({
    id: project._id,
    ...toProjectSlideData(project),
    href: project.slug ? href(lang, routes.project(project.slug)) : undefined,
  }));
  return { filters: { usable, active }, slides };
}

/** The project after `slug` in the editors' order, wrapping round to the first; `null` when it is the only one. */
export function nextProject(order: PROJECT_ORDER_QUERY_RESULT, slug: string, lang: Locale) {
  const position = order.findIndex((project) => project.slug === slug);
  if (order.length < 2 || position < 0) return null;
  const next = at(order, (position + 1) % order.length);
  return { title: next.title, href: href(lang, routes.project(next.slug)) };
}

/** One project's page: the hero slide, the text, who made it, the stills and where to go next. */
export function toProject(project: NonNullable<PROJECT_QUERY_RESULT>, order: PROJECT_ORDER_QUERY_RESULT, lang: Locale) {
  return {
    slide: toProjectSlideData(project),
    description: project.description,
    /** `data-sanity` value that makes the description clickable in the Presentation tool. */
    descriptionAttribute: editAttr("project", project._id, "description"),
    // A credit with no name has nothing to show.
    credits: (project.credits ?? []).flatMap((credit) =>
      credit.name
        ? [
            {
              key: credit._key,
              role: credit.role,
              name: credit.name,
              href: credit.talentSlug ? href(lang, routes.person(credit.talentSlug)) : null,
            },
          ]
        : [],
    ),
    stills: toProjectStills(project.stills),
    next: project.slug ? nextProject(order, project.slug, lang) : null,
  };
}

/** The page title and description of a project's page: its blurb, else the line under its title. */
export function toProjectMeta(project: Pick<NonNullable<PROJECT_QUERY_RESULT>, "title" | "description"> & Meta) {
  return { title: project.title, description: plainText(project.description) || projectMeta(project) || undefined };
}
