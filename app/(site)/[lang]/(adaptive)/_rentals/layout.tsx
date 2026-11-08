import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QUOTE_CATALOGUE_QUERY } from "@/content/rentalItem";
import { type CatalogueItem, CatalogueProvider, QuoteDrawer } from "@/features/rentals";
import { defaultLocale, isLocale, type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { toSizedImage } from "@/sanity/lib/image";
import { cachedSanity } from "@/sanity/lib/live";

// Rentals is hidden for now: the `_` prefix makes this a private folder, so none of it is routed (`/rentals*` is a
// 404). To bring it back, rename the folder to `rentals`, restore the typed `PageProps`/`LayoutProps` generics
// (`PageProps<"/[lang]/rentals">`, ...), re-add the nav item in lib/i18n/nav.ts and drop `testIgnore`/skips in e2e.

/** Labels for basket lines. Published content only, so it is cached and keeps the shell static. */
async function catalogueLookup(lang: Locale) {
  const { data } = await cachedSanity({
    query: QUOTE_CATALOGUE_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective: "published",
    stega: false,
  });
  const items: Record<string, CatalogueItem> = {};
  for (const entry of data) {
    items[entry.baseId] = {
      id: entry.baseId,
      name: entry.name,
      brand: entry.brand,
      href: localizedPath(lang, `/rentals/${entry.slug}`),
      max: entry.maxQuantity ?? 99,
      image: entry.image ? toSizedImage({ ...entry.image, dimensions: null }, 160) : null,
    };
  }
  return items;
}

export default async function RentalsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
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
