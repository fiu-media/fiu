import { createDataAttribute } from "next-sanity";
import type { SizedImage } from "./rentals";

export type TalentSlide = { id: string; title: string; meta: string; role?: string; image: SizedImage | null; vimeoUrl: string | null; previewLoopUrl: string | null };

/** `data-sanity` value that makes a field clickable in the Presentation tool. */
export function talentAttribute(documentId: string, path: string): string {
  return createDataAttribute({ id: documentId, type: "talent", path, baseUrl: "/studio" }).toString();
}
