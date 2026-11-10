import { createDataAttribute } from "next-sanity";

import { studioUrl } from "../studio-env";
import { publishedId } from "./image";

/** The document types the site makes clickable in the Presentation tool. */
export type EditableType = "siteSettings" | "project" | "talent";

/**
 * `data-sanity` value that makes a field clickable in the Presentation tool and opens it in the hosted Studio.
 * Drafts are shown in preview as `drafts.<id>`, but the overlay wants the published id.
 */
export function editAttr(type: EditableType, id: string, path: string): string {
  return createDataAttribute({ id: publishedId(id), type, path, baseUrl: studioUrl }).toString();
}
