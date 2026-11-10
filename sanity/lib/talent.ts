import { editAttr } from "./editing";
import type { SizedImage } from "./image";

export type TalentSlide = {
  id: string;
  title: string;
  meta: string;
  role?: string;
  image: SizedImage | null;
  vimeoUrl: string | null;
  previewLoopUrl: string | null;
};

/**
 * `data-sanity` value that makes a field clickable in the Presentation tool.
 * @deprecated Use `editAttr("talent", id, path)`.
 */
export function talentAttribute(documentId: string, path: string): string {
  return editAttr("talent", documentId, path);
}
