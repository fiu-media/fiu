import { features } from "@/lib/features";

/** Whether Rentals is switched on; see `lib/features.ts`. */
export const rentalsEnabled = features.rentals;

export type { CatalogueItem } from "./basket/CatalogueContext";
export { CatalogueProvider, itemMax, useCatalogue, useItemMax } from "./basket/CatalogueContext";
export { useQuoteBasket } from "./basket/store";
export { DetailAddToQuote } from "./components/DetailAddToQuote";
export { QuoteDrawer } from "./components/QuoteDrawer";
export { QuoteLines } from "./components/QuoteLines";
export type { CatalogueCard } from "./components/RentalCatalogue";
export { RentalCatalogue } from "./components/RentalCatalogue";
export { RentalGallery } from "./components/RentalGallery";
export { CatalogueSkeleton, ItemSkeleton } from "./components/RentalSkeletons";
