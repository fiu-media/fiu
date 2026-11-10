import { editAttr } from "./editing";

/**
 * `data-sanity` value that makes a Site settings field clickable in the Presentation tool.
 * @deprecated Use `editAttr("siteSettings", id, path)`.
 */
export function settingsAttribute(documentId: string, path: string): string {
  return editAttr("siteSettings", documentId, path);
}
