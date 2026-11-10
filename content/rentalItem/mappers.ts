import type { CatalogueItem } from "@/features/rentals/basket/CatalogueContext";
import { MAX_QTY } from "@/features/rentals/basket/quantity";
import type { CatalogueCard } from "@/features/rentals/components/RentalCatalogue";
import type { Locale } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";
import type { QUOTE_CATALOGUE_QUERY_RESULT, RENTAL_ITEM_QUERY_RESULT, RENTALS_QUERY_RESULT } from "@/sanity.types";
import { publishedId, type SizedImage, toSizedImage } from "@/sanity/lib/image";

/** Image widths (px) the rental views ask for. */
const CARD_WIDTH = 800;
const DETAIL_WIDTH = 1400;
const BASKET_THUMB_WIDTH = 160;

/** The catalogue page: the filter's categories and one card per item. */
export function toCatalogue({ categories, items }: RENTALS_QUERY_RESULT): {
  categories: { id: string; title: string }[];
  cards: CatalogueCard[];
} {
  return {
    categories: categories.map((category) => ({ id: category.slug, title: category.title })),
    cards: items.map((item) => ({
      id: publishedId(item.baseId),
      name: item.name,
      slug: item.slug,
      brand: item.brand,
      summary: item.summary,
      categoryId: item.category?.slug ?? null,
      image: item.images?.[0] ? toSizedImage(item.images[0], CARD_WIDTH) : null,
    })),
  };
}

/** An item page, ready to render: lists are never null, the images are sized and the spec rows are keyed. */
export type RentalItemView = {
  id: string;
  name: string;
  brand: string | null;
  summary: string | null;
  categoryTitle: string | null;
  /** The item's cap, which the quantity picker shows. */
  maxQuantity: number | null;
  images: SizedImage[];
  features: string[];
  specs: { key: string; term: string; detail: string }[];
  kit: string[];
};

/** `null` for an item that doesn't exist (or isn't available), which the page turns into a 404. */
export function toRentalItem(item: RENTAL_ITEM_QUERY_RESULT): RentalItemView | null {
  if (!item) return null;
  return {
    id: publishedId(item.baseId),
    name: item.name,
    brand: item.brand,
    summary: item.summary,
    categoryTitle: item.category?.title ?? null,
    maxQuantity: item.maxQuantity,
    images: (item.images ?? []).flatMap((image) => toSizedImage(image, DETAIL_WIDTH) ?? []),
    features: item.keyFeatures ?? [],
    specs: (item.specs ?? []).map((spec) => ({ key: spec._key, term: spec.key, detail: spec.value })),
    kit: item.includedInKit ?? [],
  };
}

/** What the drawer and the quote form need to label basket lines, by the id the basket stores. */
export function toQuoteCatalogue(lang: Locale, items: QUOTE_CATALOGUE_QUERY_RESULT): Record<string, CatalogueItem> {
  const catalogue: Record<string, CatalogueItem> = {};
  for (const item of items) {
    catalogue[item.baseId] = {
      id: item.baseId,
      name: item.name,
      brand: item.brand,
      slug: item.slug,
      href: href(lang, routes.rentalItem(item.slug)),
      // An item with no cap of its own can still only be asked for up to `MAX_QTY`.
      max: item.maxQuantity ?? MAX_QTY,
      // The lookup has no dimensions, so the image gets the default 4:3 frame.
      image: item.image ? toSizedImage({ ...item.image, dimensions: null }, BASKET_THUMB_WIDTH) : null,
    };
  }
  return catalogue;
}
