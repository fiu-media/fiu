import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { pageGutter } from "@/components/nav/rail";
import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { PageTitle } from "@/components/ui/PageTitle";
import { cn } from "@/lib/cn";
import { countryNames } from "@/lib/forms/countries";
import { isLocale, languageAlternates } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPageText } from "@/sanity/lib/pageText";
import { QuoteForm } from "./QuoteForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { quote } = await getDictionary(lang);
  return { title: quote.title, alternates: languageAlternates(lang, "/rentals/quote"), robots: { index: false } };
}

export default async function QuotePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ quote, basket, forms, common, dates }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return (
    <main className={cn("mx-auto max-w-6xl pb-32", pageGutter)}>
      <header className="mb-10">
        <PageTitle title={quote.title} />
        {text.quoteIntro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{text.quoteIntro}</p>}
      </header>
      {/* QuoteForm reads the link's query (prefill), which needs a boundary to keep the page static. */}
      <Suspense fallback={<QuoteFormSkeleton label={common.loading} />}>
        <QuoteForm lang={lang} dict={{ quote, basket, forms, common, dates }} countries={countryNames(lang)} />
      </Suspense>
    </main>
  );
}
