import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CatalogueProvider, QuoteDrawer } from "@/features/rentals";
import { getQuoteCatalogue } from "@/features/rentals/loaders";
import { features } from "@/lib/features";
import { getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function RentalsLayout({ children, params }: LayoutProps<"/[lang]/rentals">) {
  // Rentals is hidden while `features.rentals` is off: every page below is a 404 and nothing is fetched. Turning the
  // flag on (lib/features.ts) is all it takes to bring it back.
  if (!features.rentals) notFound();
  const lang = await getLocale(params);
  const [dict, items] = await Promise.all([getDictionary(lang), getQuoteCatalogue(lang)]);
  return (
    <CatalogueProvider items={items}>
      {children}
      <Suspense>
        <QuoteDrawer lang={lang} dict={dict.basket} />
      </Suspense>
    </CatalogueProvider>
  );
}
