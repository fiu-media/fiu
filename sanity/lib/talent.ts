import { createDataAttribute, type PortableTextBlock } from "next-sanity";
import type { SanityImage as QueriedImage, SizedImage } from "./rentals";

/** Result shapes of the talent queries (hand-written until we adopt typegen). */
export type TalentCard = {
  _id: string;
  name: string;
  slug: string;
  roles: string[] | null;
  portrait: QueriedImage | null;
};

export type TalentProfile = TalentCard & {
  bio: PortableTextBlock[] | null;
  /** The default-language document that projects credit. */
  talentId: string;
};

export type TalentProject = {
  _id: string;
  title: string;
  slug: string;
  type: string | null;
  year: number | null;
  client: string | null;
  vimeoUrl: string | null;
  previewLoopUrl: string | null;
  cover: QueriedImage | null;
  roles: string[] | null;
};

export type TalentSlide = { id: string; title: string; meta: string; role?: string; image: SizedImage | null; vimeoUrl: string | null; previewLoopUrl: string | null };

/** `data-sanity` value that makes a field clickable in the Presentation tool. */
export function talentAttribute(documentId: string, path: string): string {
  return createDataAttribute({ id: documentId, type: "talent", path, baseUrl: "/studio" }).toString();
}
