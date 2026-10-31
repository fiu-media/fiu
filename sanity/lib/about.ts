import { createDataAttribute, type PortableTextBlock } from "next-sanity";
import type { SanityImage } from "./rentals";

/** Result shape of the About query (hand-written until we adopt typegen). */
export type AboutSettings = {
  _id: string;
  slogan: string | null;
  sloganGloss: string | null;
  manifesto: PortableTextBlock[] | null;
  contactEmail: string | null;
  instagram: string | null;
  still: SanityImage | null;
} | null;

/** `data-sanity` value that makes a Site settings field clickable in the Presentation tool. */
export function settingsAttribute(documentId: string, path: string): string {
  return createDataAttribute({ id: documentId, type: "siteSettings", path, baseUrl: "/studio" }).toString();
}
