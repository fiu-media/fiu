import { createDataAttribute } from "next-sanity";

/** `data-sanity` value that makes a project field clickable in the Presentation tool. */
export function projectAttribute(documentId: string, path: string): string {
  return createDataAttribute({ id: documentId, type: "project", path, baseUrl: "/studio" }).toString();
}
