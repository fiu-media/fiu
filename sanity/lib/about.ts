import { createDataAttribute } from "next-sanity";

/** `data-sanity` value that makes a Site settings field clickable in the Presentation tool. */
export function settingsAttribute(documentId: string, path: string): string {
  return createDataAttribute({ id: documentId, type: "siteSettings", path, baseUrl: "/studio" }).toString();
}
