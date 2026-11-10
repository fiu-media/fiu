"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { SizedImage } from "@/sanity/lib/image";

import { MAX_QTY } from "./quantity";

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

const CatalogueContext = createContext<Record<string, CatalogueItem>>({});

/** Lets the drawer and the quote form label basket lines (which store only ids) without refetching. */
export function CatalogueProvider({ items, children }: { items: Record<string, CatalogueItem>; children: ReactNode }) {
  return <CatalogueContext value={items}>{children}</CatalogueContext>;
}

export const useCatalogue = () => useContext(CatalogueContext);

/** The most of an item one quote can hold: its own cap, else `fallback` (what the page knows), else `MAX_QTY`. */
export const itemMax = (catalogue: Record<string, CatalogueItem>, id: string, fallback?: number) =>
  catalogue[id]?.max ?? fallback ?? MAX_QTY;

/** `itemMax` for one item. Use `itemMax` with `useCatalogue()` when looping over lines. */
export const useItemMax = (id: string, fallback?: number) => itemMax(useCatalogue(), id, fallback);
