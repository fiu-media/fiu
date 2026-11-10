import type { Metadata } from "next";
import { Suspense } from "react";

import { FullScreenSkeleton } from "@/components/ui/Skeleton";
import { AboutLayoutA, getAbout } from "@/features/about";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMetadata, routes } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const lang = await getLocale(params);
  const { about } = await getDictionary(lang);
  return pageMetadata(lang, routes.about(), { title: about.title });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const lang = await getLocale(params);
  const { common } = await getDictionary(lang);
  // Draft mode makes the content dynamic, so it streams in behind a full-screen placeholder.
  return (
    <Suspense fallback={<FullScreenSkeleton label={common.loading} />}>
      <About lang={lang} />
    </Suspense>
  );
}

async function About({ lang }: { lang: Locale }) {
  return <AboutLayoutA {...await getAbout(lang)} />;
}
