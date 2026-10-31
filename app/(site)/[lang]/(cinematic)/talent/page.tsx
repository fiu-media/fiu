import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { NameIndex, type IndexItem } from "@/components/talent/NameIndex";
import { defaultLocale, isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { TALENT_QUERY } from "@/sanity/lib/queries";
import { toSizedImage } from "@/sanity/lib/rentals";
import type { TalentCard } from "@/sanity/lib/talent";

export async function generateMetadata({ params }: PageProps<"/[lang]/talent">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { talent } = await getDictionary(lang);
  return { title: talent.title, alternates: languageAlternates(lang, "/talent") };
}

export default async function TalentPage({ params }: PageProps<"/[lang]/talent">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { talent, common } = await getDictionary(lang);
  return (
    <main className="mx-auto max-w-6xl px-4 pt-24 pb-32 md:px-6 md:pt-16">
      <h1 className="font-display mb-10 text-5xl md:text-6xl">{talent.title}</h1>
      {/* Reads draft mode, so it streams in behind the static heading. */}
      <Suspense fallback={<IndexSkeleton label={common.loading} />}>
        <Roster lang={lang} />
      </Suspense>
    </main>
  );
}

async function Roster({ lang }: { lang: Locale }) {
  const { talent } = await getDictionary(lang);
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: TALENT_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  const people = (data ?? []) as TalentCard[];
  if (people.length === 0) return <p className="text-fg-muted">{talent.empty}</p>;

  const items: IndexItem[] = people.map((person) => ({
    title: person.name,
    meta: (person.roles ?? []).join(", "),
    href: localizedPath(lang, `/talent/${person.slug}`),
    image: person.portrait ? toSizedImage(person.portrait, 640) : null,
  }));
  return <NameIndex label={talent.indexLabel} items={items} ratio="4/5" previewWidth={240} />;
}

function IndexSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="divide-y divide-line border-y border-line">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="py-5 md:py-6">
          <Skeleton className="h-9 w-2/3 md:h-14" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
