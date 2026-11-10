import type { Metadata } from "next";
import { Suspense } from "react";

import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { getSiteSettings } from "@/content/siteSettings";
import { countryList } from "@/lib/forms/countries";
import { getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMetadata, routes } from "@/lib/routes";

import { QuoteForm } from "./QuoteForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals/quote">): Promise<Metadata> {
  const lang = await getLocale(params);
  const { quote } = await getDictionary(lang);
  return pageMetadata(lang, routes.quote(), { title: quote.title, robots: { index: false } });
}

export default async function QuotePage({ params }: PageProps<"/[lang]/rentals/quote">) {
  const lang = await getLocale(params);
  const [{ quote, basket, forms, common, dates }, settings] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    <PageShell>
      <PageHeader title={quote.title} intro={settings.quoteIntro} className="mb-10" />
      {/* QuoteForm reads the link's query (prefill), which needs a boundary to keep the page static. */}
      <Suspense fallback={<QuoteFormSkeleton label={common.loading} />}>
        <QuoteForm lang={lang} dict={{ quote, basket, forms, common, dates }} countries={countryList(lang)} />
      </Suspense>
    </PageShell>
  );
}
