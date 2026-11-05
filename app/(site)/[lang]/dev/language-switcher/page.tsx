import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageConcepts, type OptionKey } from "./LanguageConcepts";

// Sign-off page for the language switcher: five looks in the side rail and the phone menu. Option E is the
// one the nav uses. Unlisted and kept out of search engines, like /dev/navbar.
export const metadata: Metadata = {
  title: "Language switcher options",
  robots: { index: false, follow: false },
};

const options: { key: OptionKey; title: string; note: string }[] = [
  {
    key: "a",
    title: "Both names (the first version)",
    note: "English and Gaeilge as small horizontal words, the current one underlined. Clear, but it is the one element in the rail that isn't set vertically.",
  },
  {
    key: "b",
    title: "Set like the links",
    note: "Both names set vertically in the same type as the page links, with the same thin line marking the current language. Reads as part of the nav.",
  },
  {
    key: "c",
    title: "The other language only",
    note: "A single quiet link to the language you are not on: Gaeilge on the English site, English on the Irish one. The least UI, but it shows no 'you are here'.",
  },
  {
    key: "d",
    title: "Capsule",
    note: "A small segmented EN / GA capsule with the thin glass edge; the current language sits on a faint fill. Compact and recognisable, and the full names are read out by screen readers.",
  },
  {
    key: "e",
    title: "Hairline codes (live)",
    note: "Bare EN and GA with a hairline between them, no outline, echoing the sprocket ticks. The current language is the brighter one. Chosen: this is what the nav uses, under the page links.",
  },
];

export default async function LanguageSwitcherPage({ params }: PageProps<"/[lang]/dev/language-switcher">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { nav } = await getDictionary(lang);

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <header className="mb-8">
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Fiú · dev</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Language switcher</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Five looks for the switcher, each shown in the desktop rail (over an image and on the adaptive surface) and in the
            phone menu. The Light scheme button previews the adaptive surfaces in light. Click a language in any option to see its
            current state change.
          </p>
        </header>
        <LanguageConcepts options={options} labels={[nav.about, nav.work, nav.talent, nav.contact]} initialLang={lang} />
      </div>
    </main>
  );
}
