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
  cover: QueriedImage | null;
  coverMobile: QueriedImage | null;
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
    image: project.cover ? toSizedImage(project.cover, COVER_WIDTH) : null,
    mobileImage: project.coverMobile ? toSizedImage(project.coverMobile, COVER_MOBILE_WIDTH) : null,
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
