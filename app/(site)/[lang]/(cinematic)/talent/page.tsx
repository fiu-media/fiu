import type { Metadata } from "next";
import { Suspense } from "react";

import { floatingBarInset, pageTop } from "@/components/layout/nav/rail";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { getSiteSettings } from "@/content/siteSettings";
import { getRoster, getTalentMeta, NameIndex } from "@/features/talent";
import { cn } from "@/lib/cn";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMetadata, routes } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/talent">): Promise<Metadata> {
  const lang = await getLocale(params);
  const { title, description } = await getTalentMeta(lang);
  return pageMetadata(lang, routes.talent(), { title, description });
}

export default async function TalentPage({ params }: PageProps<"/[lang]/talent">) {
  const lang = await getLocale(params);
  const [{ talent, common }, { talentTagline, talentIntro }] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    <PageShell className={cn(floatingBarInset, pageTop)}>
      <PageHeader title={talent.title} tagline={talentTagline} intro={talentIntro} className="mb-10" />
      {/* Reads draft mode, so it streams in behind the static heading. */}
      <Suspense fallback={<IndexSkeleton label={common.loading} />}>
        <Roster lang={lang} />
      </Suspense>
    </PageShell>
  );
}

async function Roster({ lang }: { lang: Locale }) {
  const [{ talent }, items] = await Promise.all([getDictionary(lang), getRoster(lang)]);
  if (items.length === 0) return <p className="text-fg-muted">{talent.empty}</p>;
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
