import { createDataAttribute } from "next-sanity";
import type { SanityImage } from "./rentals";

/** Result shapes of the Our Work query (hand-written until we adopt typegen). */
export type WorkType = { slug: string; title: string };

export type WorkProject = {
  _id: string;
  title: string;
  slug: string;
  typeSlug: string | null;
  type: string | null;
  year: number | null;
  client: string | null;
  vimeoUrl: string | null;
  previewLoopUrl: string | null;
  cover: SanityImage | null;
};

export type WorkResult = { types: WorkType[]; projects: WorkProject[] };

/** `data-sanity` value that makes a project field clickable in the Presentation tool. */
export function projectAttribute(documentId: string, path: string): string {
  return createDataAttribute({ id: documentId, type: "project", path, baseUrl: "/studio" }).toString();
}
