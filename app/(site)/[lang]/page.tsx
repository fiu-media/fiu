import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { preload } from "react-dom";
import { HomeHero } from "@/components/home/HomeHero";
import { GlassNav } from "@/components/nav/GlassNav";
import { EdgeBars } from "@/components/ui/EdgeBars";
import { fallbackStills } from "@/lib/fallback-stills";
import { defaultLocale, isLocale, languageAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { HOME_STILLS_QUERY } from "@/sanity/lib/queries";
import { toHeroStill, type HeroStill, type HomeStillsResult } from "@/sanity/lib/stills";

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
    <main data-surface="cinematic" className="relative isolate h-dvh overflow-hidden bg-ink">
      <EdgeBars />
      <h1 className="sr-only">{dict.site.name}</h1>
      {/* Reads draft mode, so it streams; the fallback stills keep the first paint identical. */}
      <Suspense fallback={<HomeHero stills={fallbackStills} />}>
        <CmsHero lang={lang} />
      </Suspense>
      {/* Same container as the adaptive header, so the nav doesn't shift between Home and other pages. */}
      <div className="relative z-10 mx-auto flex max-w-6xl justify-center px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-4 md:absolute md:inset-x-0 md:top-0 md:justify-end md:px-[max(1.5rem,env(safe-area-inset-left))] md:pt-[max(1.5rem,env(safe-area-inset-top))] md:pb-6">
        <GlassNav items={getNavItems(lang, dict)} label={dict.nav.label} onImage />
      </div>
    </main>
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
  const { data } = await cachedSanity({ query: HOME_STILLS_QUERY, params: { lang, fallbackLang: defaultLocale }, perspective, variant, stega: false });
  const settings = data as HomeStillsResult;
  const stills = (settings?.stills ?? []).map((s) => toHeroStill(settings!._id, s)).filter((s): s is HeroStill => s !== null);
  return stills.length > 0 ? stills : fallbackStills;
}
