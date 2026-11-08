"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { SizedImage } from "@/sanity/lib/image";

export type CatalogueItem = {
  id: string;
  name: string;
  brand: string | null;
  href: string;
  /** Most of this item one quote can ask for (set per item in Sanity). */
  max: number;
  image: SizedImage | null;
};

const CatalogueContext = createContext<Record<string, CatalogueItem>>({});

/** Lets the drawer and the quote form label basket lines (which store only ids) without refetching. */
export function CatalogueProvider({ items, children }: { items: Record<string, CatalogueItem>; children: ReactNode }) {
  return <CatalogueContext value={items}>{children}</CatalogueContext>;
}

export const useCatalogue = () => useContext(CatalogueContext);
