import { Suspense } from "react";
import { HomeHero } from "@/components/home/HomeHero";
import { GlassNav } from "@/components/nav/GlassNav";
import { fallbackStills } from "@/lib/fallback-stills";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { HOME_STILLS_QUERY } from "@/sanity/lib/queries";
import { toHeroStill, type HeroStill, type HomeStillsResult } from "@/sanity/lib/stills";

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];

export default function Home() {
  return (
    <main data-surface="cinematic" className="relative isolate h-dvh overflow-hidden bg-ink">
      <h1 className="sr-only">Fiú Media</h1>
      {/* Reads draft mode, so it streams; the fallback stills keep the first paint identical. */}
      <Suspense fallback={<HomeHero stills={fallbackStills} />}>
        <CmsHero />
      </Suspense>
      <div className="relative z-10 flex justify-center p-4 md:absolute md:top-6 md:right-6 md:p-0">
        <GlassNav items={nav} onImage />
      </div>
    </main>
  );
}

async function CmsHero() {
  const { perspective, variant } = await getDynamicFetchOptions();
  const stills = await homeStills(perspective, variant);
  return <HomeHero stills={stills} />;
}

async function homeStills(
  perspective: Awaited<ReturnType<typeof getDynamicFetchOptions>>["perspective"],
  variant: string | undefined,
): Promise<HeroStill[]> {
  const { data } = await cachedSanity({ query: HOME_STILLS_QUERY, perspective, variant, stega: false });
  const settings = data as HomeStillsResult;
  const stills = (settings?.stills ?? []).map((s) => toHeroStill(settings!._id, s)).filter((s): s is HeroStill => s !== null);
  return stills.length > 0 ? stills : fallbackStills;
}
