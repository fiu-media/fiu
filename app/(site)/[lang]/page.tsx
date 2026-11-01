import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { preload } from "react-dom";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeScrollLock } from "@/components/home/HomeScrollLock";
import { SiteNav } from "@/components/nav/SiteNav";
import { fallbackStills } from "@/lib/fallback-stills";
import { defaultLocale, isLocale, languageAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { HOME_STILLS_QUERY } from "@/sanity/lib/queries";
import { toHeroStill, type HeroStill } from "@/sanity/lib/stills";

export const viewport: Viewport = { themeColor: "#0c0b0d" };

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { alternates: languageAlternates(lang, "/") } : {};
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    // On mobile the photo bleeds 12rem past the page above and below, inside a document that is pinned in the middle
    // (HomeScrollLock), so Safari has real pixels to show behind its status bar and toolbar. Off from md up, Home is a
    // plain h-dvh page.
    <div data-surface="cinematic" data-home-lock className="bg-ink max-md:py-48">
      <HomeScrollLock />
      <main className="relative isolate h-dvh bg-ink md:overflow-hidden">
        <h1 className="sr-only">{dict.site.name}</h1>
        {/* Reads draft mode, so it streams; the fallback stills keep the first paint identical. */}
        <Suspense fallback={<HomeHero stills={fallbackStills} />}>
          <CmsHero lang={lang} />
        </Suspense>
        <SiteNav lang={lang} onImage />
      </main>
    </div>
  );
}

async function CmsHero({ lang }: { lang: Locale }) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const stills = await homeStills(lang, perspective, variant);
  // The glass logo's WebGL scene can't draw until its first still has loaded. Start that download
  // with the HTML, not after the scene's code has mounted. `crossOrigin` must match the texture
  // loader's request (anonymous CORS) or the browser won't reuse the preloaded response.
  if (stills[0]) preload(stills[0].src, { as: "image", crossOrigin: "anonymous" });
  return <HomeHero stills={stills} />;
}

async function homeStills(
  lang: Locale,
  perspective: Awaited<ReturnType<typeof getDynamicFetchOptions>>["perspective"],
  variant: string | undefined,
): Promise<HeroStill[]> {
  const { data } = await cachedSanity({
    query: HOME_STILLS_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  const stills = (data?.stills ?? []).map((s) => toHeroStill(data!._id, s)).filter((s): s is HeroStill => s !== null);
  return stills.length > 0 ? stills : fallbackStills;
}
