import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogueSkeleton } from "@/components/rentals/RentalSkeletons";
import { RentalCatalogue, type CatalogueCard } from "@/components/rentals/RentalCatalogue";
import { PageTitle } from "@/components/ui/PageTitle";
import { defaultLocale, isLocale, languageAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { getPageText } from "@/sanity/lib/pageText";
import { RENTALS_QUERY } from "@/sanity/lib/queries";
import { publishedId, toRentalImage } from "@/sanity/lib/rentals";

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const [{ rentals }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return { title: rentals.title, description: text.rentalsIntro ?? undefined, alternates: languageAlternates(lang, "/rentals") };
}

export default async function RentalsPage({ params }: PageProps<"/[lang]/rentals">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ rentals, common }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 md:px-6">
      <header className="mb-10">
        <PageTitle title={rentals.title} tagline={text.rentalsTagline} />
        {text.rentalsIntro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{text.rentalsIntro}</p>}
      </header>
      {/* Reads draft mode, so it streams in behind the static heading. */}
      <Suspense fallback={<CatalogueSkeleton label={common.loading} />}>
        <Catalogue lang={lang} />
      </Suspense>
    </main>
  );
}

async function Catalogue({ lang }: { lang: Locale }) {
  const { rentals } = await getDictionary(lang);
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({ query: RENTALS_QUERY, params: { lang, fallbackLang: defaultLocale }, perspective, variant, stega: false });
  const { categories, items } = data;

  const cards: CatalogueCard[] = items.map((item) => ({
    id: publishedId(item._id),
    name: item.name,
    slug: item.slug,
    brand: item.brand,
    summary: item.summary,
    categoryId: item.category?.slug ?? null,
    image: item.images?.[0] ? toRentalImage(item.images[0], 800) : null,
  }));

  return (
    <RentalCatalogue
      lang={lang}
      categories={categories.map((c) => ({ id: c.slug, title: c.title }))}
      items={cards}
      dict={rentals}
    />
  );
}
