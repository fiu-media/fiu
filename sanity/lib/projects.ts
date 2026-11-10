import { editAttr } from "./editing";

/**
 * `data-sanity` value that makes a project field clickable in the Presentation tool.
 * @deprecated Use `editAttr("project", id, path)`.
 */
export function projectAttribute(documentId: string, path: string): string {
  return editAttr("project", documentId, path);
}
