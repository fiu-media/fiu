import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { pageGutter } from "@/components/nav/rail";
import { QuoteFormSkeleton } from "@/components/forms/FormSkeleton";
import { cn } from "@/lib/cn";
import { isLocale, languageAlternates } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPageText } from "@/sanity/lib/pageText";
import { QuoteForm } from "./QuoteForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/rentals/quote">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { quote } = await getDictionary(lang);
  return { title: quote.title, alternates: languageAlternates(lang, "/rentals/quote"), robots: { index: false } };
}

export default async function QuotePage({ params }: PageProps<"/[lang]/rentals/quote">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ quote, basket, forms, common, dates }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return (
    <main className={cn("mx-auto max-w-6xl pb-32", pageGutter)}>
      <header className="mb-10">
        <h1 className="font-display text-5xl md:text-6xl">{quote.title}</h1>
        {text.quoteIntro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{text.quoteIntro}</p>}
      </header>
      {/* QuoteForm reads the link's query (prefill), which needs a boundary to keep the page static. */}
      <Suspense fallback={<QuoteFormSkeleton label={common.loading} />}>
        <QuoteForm lang={lang} dict={{ quote, basket, forms, common, dates }} />
      </Suspense>
    </main>
  );
}
