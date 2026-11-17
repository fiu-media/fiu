import type { Metadata } from "next";
import { Suspense } from "react";
import { preload } from "react-dom";

import { InlineScript } from "@/components/layout/InlineScript";
import { SiteNav } from "@/components/layout/nav/SiteNav";
import {
  getHomeFold,
  getHomeStills,
  HomeFold,
  HomeHero,
  HomeHeroFallback,
  HomeScrollLock,
  pinHomeScrollScript,
} from "@/features/home";
import { SiteFooter, SiteJsonLd, siteMetadata } from "@/features/site";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LANDSCAPE, PORTRAIT } from "@/lib/media";
import { railInset } from "@/lib/rail";
import { routes } from "@/lib/routes";
import { skipTarget } from "@/lib/skipLink";
import { cinematicViewport } from "@/lib/theme";

export const viewport = cinematicViewport;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const lang = await getLocale(params);
  return siteMetadata(lang, routes.home());
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = await getLocale(params);
  const dict = await getDictionary(lang);
  return (
    <div data-surface="cinematic" className="bg-ink">
      <SiteJsonLd lang={lang} />
      <HomeScrollLock />
      <main {...skipTarget}>
        {/* On mobile the photo bleeds past the hero by --bleed, above and below: real pixels for the browser to show
            behind the notch and the top bar. The safe-area inset is 0 in a browser that isn't fullscreen, so 3.75rem (the
            tallest status bar, 59pt) is the floor. The photo layer is only as tall as the hero plus that, so the still is
            scaled to the hero, not to a much taller box that crops it. The page rests on the hero (the pin script and
            HomeScrollLock), and the fold starts 12rem below it, so nothing of the fold shows in the first screen, however far the toolbars and the home indicator reach over the page (100lvh - 100svh was tried as a measure of that and still let the team photo show on a phone, so this is a fixed margin). The hero uses svh on phones so toolbar show/hide
            doesn't resize the first screen; from md up it is a plain h-dvh screen. */}
        <div className="max-md:pt-(--bleed) max-md:pb-48 max-md:[--bleed:max(env(safe-area-inset-top),3.75rem)]">
          <div data-hero className="relative isolate h-svh bg-ink select-none md:h-dvh md:overflow-hidden">
            {/* The hero is imagery only: select-none stops a select-all or long-press copying the stills' alt texts as one string. */}
            <h1 className="sr-only">{dict.site.name}</h1>
            {/* Reads draft mode, so it streams in behind the splash, which is all the first paint shows. */}
            <Suspense fallback={<HomeHeroFallback />}>
              <CmsHero lang={lang} />
            </Suspense>
            <SiteNav lang={lang} onImage overFootage />
          </div>
        </div>
        {/* Pin as soon as the bleed hero exists (tall enough to scroll to it), before the fold streams in. */}
        <InlineScript html={pinHomeScrollScript} />
        {/* Under the fold: the team, the slogan and the work. Beside the rail like every other page. */}
        <div className={railInset}>
          <Suspense>
            <Fold lang={lang} />
          </Suspense>
          <SiteFooter lang={lang} />
        </div>
      </main>
    </div>
  );
}

async function CmsHero({ lang }: { lang: Locale }) {
  const [stills, { home }] = await Promise.all([getHomeStills(lang), getDictionary(lang)]);
  const labels = { pause: home.pauseStills, play: home.playStills };
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
  return <HomeHero {...stills} labels={labels} />;
}

/** Home's fold, under the hero. Reads draft mode, so it streams in. */
async function Fold({ lang }: { lang: Locale }) {
  return <HomeFold {...await getHomeFold(lang)} />;
}
