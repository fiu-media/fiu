import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, languageAlternates } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
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
  const { quote, basket, forms } = await getDictionary(lang);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 md:px-6">
      <h1 className="font-display text-5xl md:text-6xl">{quote.title}</h1>
      <p className="mt-4 mb-10 max-w-2xl text-lg text-fg-muted">{quote.intro}</p>
      <QuoteForm lang={lang} dict={{ quote, basket, forms }} />
    </main>
  );
}
