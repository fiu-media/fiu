import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/ui/BackLink";
import { DetailList } from "@/components/ui/DetailList";
import { PageShell } from "@/components/ui/PageShell";
import { DetailAddToQuote, ItemSkeleton, RentalGallery } from "@/features/rentals";
import { getRentalItem } from "@/features/rentals/loaders";
import { getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href, pageMetadata, routes } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getLocale(params);
  const item = await getRentalItem(lang, slug);
  if (!item) return {};
  return pageMetadata(lang, routes.rentalItem(slug), { title: item.name, description: item.summary ?? undefined });
}

export default function RentalItemPage({ params }: PageProps<"/[lang]/rentals/[slug]">) {
  // Slugs are only known at runtime, so the item streams in behind a Suspense boundary.
  return (
    <PageShell>
      <Suspense fallback={<ItemSkeleton />}>
        <Item params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Item({ params }: { params: PageProps<"/[lang]/rentals/[slug]">["params"] }) {
  const { slug } = await params;
  const lang = await getLocale(params);
  const [{ rentals }, item] = await Promise.all([getDictionary(lang), getRentalItem(lang, slug)]);
  if (!item) notFound();

  return (
    <article>
      <BackLink href={href(lang, routes.rentals())}>{rentals.backToRentals}</BackLink>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <RentalGallery images={item.images} name={item.name} dict={rentals} />

        <div className="flex flex-col gap-8">
          <header>
            {item.brand && <p className="eyebrow">{item.brand}</p>}
            <h1 className="font-display text-4xl md:text-5xl">{item.name}</h1>
            {item.categoryTitle && <p className="mt-2 text-fg-muted">{item.categoryTitle}</p>}
            {item.summary && <p className="mt-4 text-lg">{item.summary}</p>}
          </header>

          <DetailAddToQuote itemId={item.id} itemName={item.name} dict={rentals} maxQuantity={item.maxQuantity} />

          {item.features.length > 0 && (
            <section aria-labelledby="item-features">
              <h2 id="item-features" className="mb-2 font-display text-2xl">
                {rentals.keyFeatures}
              </h2>
              <ul className="list-disc space-y-1 pl-5 marker:text-fg-muted">
                {item.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </section>
          )}

          {item.specs.length > 0 && (
            <section aria-labelledby="item-specs">
              <h2 id="item-specs" className="mb-2 font-display text-2xl">
                {rentals.specs}
              </h2>
              <DetailList rows={item.specs} />
            </section>
          )}

          {item.kit.length > 0 && (
            <section aria-labelledby="item-kit">
              <h2 id="item-kit" className="mb-2 font-display text-2xl">
                {rentals.includedInKit}
              </h2>
              <ul className="list-disc space-y-1 pl-5 marker:text-fg-muted">
                {item.kit.map((entry) => (
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
