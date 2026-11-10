import type { SizedImage } from "@/sanity/lib/image";

/** One card on the catalogue page. */
export type CatalogueCard = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  summary: string | null;
  categoryId: string | null;
  image: SizedImage | null;
};

/** What the drawer and the quote form need to label a basket line. */
export type CatalogueItem = {
  id: string;
  name: string;
  brand: string | null;
  slug: string;
  /** The item's page, in the language the catalogue was built for. */
  href: string;
  /** Most of this item one quote can ask for (set per item in Sanity). */
  max: number;
  image: SizedImage | null;
};
