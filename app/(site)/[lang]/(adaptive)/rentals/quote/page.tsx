import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const [{ quote, basket, forms, common }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 md:px-6">
      <header className="mb-10">
        <h1 className="font-display text-5xl md:text-6xl">{quote.title}</h1>
        {text.quoteIntro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{text.quoteIntro}</p>}
      </header>
      <QuoteForm lang={lang} dict={{ quote, basket, forms, common }} />
    </main>
  );
}
