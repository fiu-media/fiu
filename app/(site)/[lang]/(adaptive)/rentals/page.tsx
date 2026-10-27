import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RentalCatalogue, type CatalogueCard } from "@/components/rentals/RentalCatalogue";
import { isLocale, languageAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { RENTALS_QUERY } from "@/sanity/lib/queries";
import { publishedId, toRentalImage, type RentalsResult } from "@/sanity/lib/rentals";

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { rentals } = await getDictionary(lang);
  return { title: rentals.title, description: rentals.intro, alternates: languageAlternates(lang, "/rentals") };
}

export default async function RentalsPage({ params }: PageProps<"/[lang]/rentals">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { rentals } = await getDictionary(lang);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 md:px-6">
      <h1 className="font-display text-5xl md:text-6xl">{rentals.title}</h1>
      <p className="mt-4 mb-10 max-w-2xl text-lg text-fg-muted">{rentals.intro}</p>
      {/* Reads draft mode, so it streams in behind the static heading. */}
      <Suspense fallback={<div aria-hidden className="h-96" />}>
        <Catalogue lang={lang} />
      </Suspense>
    </main>
  );
}

async function Catalogue({ lang }: { lang: Locale }) {
  const { rentals } = await getDictionary(lang);
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({ query: RENTALS_QUERY, params: { lang }, perspective, variant, stega: false });
  const { categories, items } = (data ?? { categories: [], items: [] }) as RentalsResult;

  const cards: CatalogueCard[] = items.map((item) => ({
    id: publishedId(item._id),
    name: item.name,
    slug: item.slug,
    brand: item.brand,
    summary: item.summary,
    keyFeatures: item.keyFeatures ?? [],
    categoryId: item.category?._id ?? null,
    image: item.images?.[0] ? toRentalImage(item.images[0], 800) : null,
  }));

  return (
    <RentalCatalogue
      lang={lang}
      categories={categories.map((c) => ({ id: c._id, title: c.title }))}
      items={cards}
      dict={rentals}
    />
  );
}
