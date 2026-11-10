import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { getSiteSettings } from "@/content/siteSettings";
import { CatalogueSkeleton, RentalCatalogue } from "@/features/rentals";
import { getCatalogue } from "@/features/rentals/loaders";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMetadata, routes } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals">): Promise<Metadata> {
  const lang = await getLocale(params);
  const [{ rentals }, settings] = await Promise.all([getDictionary(lang), getSiteSettings(lang, { draft: false })]);
  return pageMetadata(lang, routes.rentals(), { title: rentals.title, description: settings.rentalsIntro ?? undefined });
}

export default async function RentalsPage({ params }: PageProps<"/[lang]/rentals">) {
  const lang = await getLocale(params);
  const [{ rentals, common }, settings] = await Promise.all([getDictionary(lang), getSiteSettings(lang, { draft: false })]);
  return (
    <PageShell>
      <PageHeader title={rentals.title} tagline={settings.rentalsTagline} intro={settings.rentalsIntro} className="mb-10" />
      {/* Reads draft mode, so it streams in behind the static heading. */}
      <Suspense fallback={<CatalogueSkeleton label={common.loading} />}>
        <Catalogue lang={lang} />
      </Suspense>
    </PageShell>
  );
}

async function Catalogue({ lang }: { lang: Locale }) {
  const [{ rentals }, { categories, cards }] = await Promise.all([getDictionary(lang), getCatalogue(lang)]);
  return <RentalCatalogue lang={lang} categories={categories} items={cards} dict={rentals} />;
}
