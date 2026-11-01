import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailAddToQuote } from "@/components/rentals/DetailAddToQuote";
import { ItemSkeleton } from "@/components/rentals/RentalSkeletons";
import { RentalGallery } from "@/components/rentals/RentalGallery";
import { defaultLocale, isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fetchQuery, getDynamicFetchOptions } from "@/sanity/lib/live";
import { RENTAL_ITEM_QUERY } from "@/sanity/lib/queries";
import { publishedId, toRentalImage } from "@/sanity/lib/rentals";

async function getItem(lang: Locale, slug: string) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const data = await fetchQuery(RENTAL_ITEM_QUERY, { parameters: { lang, fallbackLang: defaultLocale, slug }, perspective, variant, stega: false });
  return data;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const item = await getItem(lang, slug);
  if (!item) return {};
  return {
    title: item.name,
    description: item.summary ?? undefined,
    alternates: languageAlternates(lang, `/rentals/${slug}`),
  };
}

export default function RentalItemPage({ params }: PageProps<"/[lang]/rentals/[slug]">) {
  // Slugs are only known at runtime, so the item streams in behind a Suspense boundary.
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 md:px-6">
      <Suspense fallback={<ItemSkeleton />}>{params.then((p) => <Item lang={p.lang} slug={p.slug} />)}</Suspense>
    </main>
  );
}

async function Item({ lang, slug }: { lang: string; slug: string }) {
  if (!isLocale(lang)) notFound();
  const [{ rentals }, item] = await Promise.all([getDictionary(lang), getItem(lang, slug)]);
  if (!item) notFound();

  const images = (item.images ?? []).flatMap((image) => toRentalImage(image, 1400) ?? []);
  const features = item.keyFeatures ?? [];
  const specs = item.specs ?? [];
  const kit = item.includedInKit ?? [];

  return (
    <article>
      <Link href={localizedPath(lang, "/rentals")} className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        ← {rentals.backToRentals}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <RentalGallery images={images} name={item.name} dict={rentals} />

        <div className="flex flex-col gap-8">
          <header>
            {item.brand && <p className="text-xs font-medium tracking-wide text-fg-muted uppercase">{item.brand}</p>}
            <h1 className="font-display text-4xl md:text-5xl">{item.name}</h1>
            {item.category && <p className="mt-2 text-fg-muted">{item.category.title}</p>}
            {item.summary && <p className="mt-4 text-lg">{item.summary}</p>}
          </header>

          <DetailAddToQuote itemId={publishedId(item._id)} itemName={item.name} dict={rentals} maxQuantity={item.maxQuantity} />

          {features.length > 0 && (
            <section aria-labelledby="item-features">
              <h2 id="item-features" className="mb-2 font-display text-2xl">
                {rentals.keyFeatures}
              </h2>
              <ul className="list-disc space-y-1 pl-5 marker:text-fg-muted">
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </section>
          )}

          {specs.length > 0 && (
            <section aria-labelledby="item-specs">
              <h2 id="item-specs" className="mb-2 font-display text-2xl">
                {rentals.specs}
              </h2>
              <dl className="divide-y divide-line border-y border-line">
                {specs.map((spec) => (
                  <div key={spec._key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2 text-sm">
                    <dt className="text-fg-muted">{spec.key}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {kit.length > 0 && (
            <section aria-labelledby="item-kit">
              <h2 id="item-kit" className="mb-2 font-display text-2xl">
                {rentals.includedInKit}
              </h2>
              <ul className="list-disc space-y-1 pl-5 marker:text-fg-muted">
                {kit.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
