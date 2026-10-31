import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogueProvider, type CatalogueItem } from "@/components/rentals/CatalogueContext";
import { QuoteDrawer } from "@/components/rentals/QuoteDrawer";
import { defaultLocale, isLocale, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity } from "@/sanity/lib/live";
import { QUOTE_CATALOGUE_QUERY } from "@/sanity/lib/queries";
import { toRentalImage } from "@/sanity/lib/rentals";

/** Labels for basket lines. Published content only, so it is cached and keeps the shell static. */
async function catalogueLookup(lang: Locale) {
  const { data } = await cachedSanity({ query: QUOTE_CATALOGUE_QUERY, params: { lang, fallbackLang: defaultLocale }, perspective: "published", stega: false });
  const items: Record<string, CatalogueItem> = {};
  for (const entry of data) {
    items[entry._id] = {
      id: entry._id,
      name: entry.name,
      brand: entry.brand,
      href: localizedPath(lang, `/rentals/${entry.slug}`),
      max: entry.maxQuantity ?? 99,
      image: entry.image ? toRentalImage({ ...entry.image, dimensions: null }, 160) : null,
    };
  }
  return items;
}

export default async function RentalsLayout({ children, params }: LayoutProps<"/[lang]/rentals">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [dict, items] = await Promise.all([getDictionary(lang), catalogueLookup(lang)]);
  return (
    <CatalogueProvider items={items}>
      {children}
      <Suspense>
        <QuoteDrawer lang={lang} dict={dict.basket} />
      </Suspense>
    </CatalogueProvider>
  );
}
