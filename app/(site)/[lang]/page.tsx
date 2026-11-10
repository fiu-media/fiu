import type { Metadata } from "next";
import { Suspense } from "react";
import { preload } from "react-dom";

import { InlineScript } from "@/components/layout/InlineScript";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import {
  fallbackHeroStills,
  getHomeFold,
  getHomeStills,
  HomeFold,
  HomeHero,
  HomeScrollLock,
  pinHomeScrollScript,
} from "@/features/home";
import { SiteFooter } from "@/features/site";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANDSCAPE, PORTRAIT } from "@/lib/media";
import { railInset } from "@/lib/rail";
import { pageMetadata, routes } from "@/lib/routes";
import { cinematicViewport } from "@/lib/theme";

export const viewport = cinematicViewport;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const lang = await getLocale(params);
  return pageMetadata(lang, routes.home());
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = await getLocale(params);
  const dict = await getDictionary(lang);
  return (
    <div data-surface="cinematic" className="bg-ink">
      <HomeScrollLock />
      <main>
        {/* On mobile the photo bleeds 12rem past the hero above and below, inside a document that can't be scrolled above
            the hero (HomeScrollLock), so Safari has real pixels to show behind its status bar and toolbar. Off from md
            up, the hero is a plain h-dvh screen. */}
        <div data-home-bleed className="max-md:py-48">
          <div data-hero className="relative isolate h-dvh bg-ink select-none md:overflow-hidden">
            {/* The hero is imagery only: select-none stops a select-all or long-press copying the stills' alt texts as one string. */}
            <h1 className="sr-only">{dict.site.name}</h1>
            {/* Reads draft mode, so it streams; the fallback stills keep the first paint identical. */}
            <Suspense fallback={<HomeHero {...fallbackHeroStills} />}>
              <CmsHero lang={lang} />
            </Suspense>
            <SiteNav lang={lang} onImage overFootage />
          </div>
        </div>
        {/* Under the fold: the team, the slogan and the work. Beside the rail like every other page. */}
        <div className={railInset}>
          <Suspense>
            <Fold lang={lang} />
          </Suspense>
          <SiteFooter lang={lang} />
        </div>
      </main>
      <InlineScript html={pinHomeScrollScript} />
    </div>
  );
}

async function CmsHero({ lang }: { lang: Locale }) {
  const stills = await getHomeStills(lang);
  // The glass logo's WebGL scene can't draw until its first still has loaded. Start that download
  // with the HTML, not after the scene's code has mounted. `crossOrigin` must match the texture
  // loader's request (anonymous CORS) or the browser won't reuse the preloaded response. The scene draws the
  // set that fits the screen, so each set's first still is only fetched on a screen that will use it.
  for (const [still, media] of [
    [stills.landscape[0], LANDSCAPE],
    [stills.portrait[0], PORTRAIT],
  ] as const) {
    if (still) preload(still.src, { as: "image", crossOrigin: "anonymous", media });
  }
  return <HomeHero {...stills} />;
}

/** Home's fold, under the hero. Reads draft mode, so it streams in. */
async function Fold({ lang }: { lang: Locale }) {
  return <HomeFold {...await getHomeFold(lang)} />;
}
