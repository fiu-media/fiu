import Image from "next/image";
import { SiteNav } from "@/components/nav/SiteNav";
import { railInset } from "@/components/nav/rail";
import { GlassPillLink } from "@/components/ui/Glass";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

import glow from "@/public/stills/glow.jpg";

export type NotFoundCopy = { eyebrow: string; heading: string; body: string; home: string };

// English only for now; the Irish text comes from Fíu.
export const notFoundCopy: NotFoundCopy = {
  eyebrow: "404",
  heading: "Page not found",
  body: "That page doesn’t exist, or it has moved.",
  home: "Back home",
};

/**
 * The site's 404: always dark, a home still behind a scrim, the rail, links home and to Our Work.
 * `className` sets the height; the default fills the viewport, /dev/not-found fits it to a preview frame.
 */
export async function NotFoundPage({
  lang,
  copy = notFoundCopy,
  className = "min-h-dvh",
}: {
  lang: Locale;
  copy?: NotFoundCopy;
  className?: string;
}) {
  const { site, nav } = await getDictionary(lang);
  return (
    <div
      data-surface="cinematic"
      className={`relative isolate flex flex-col overflow-hidden bg-ink text-fg ${railInset} ${className}`}
    >
      <Image src={glow} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      <SiteNav lang={lang} onImage />
      <main className="flex flex-1 flex-col justify-end gap-6 px-6 pt-24 pb-14 md:px-12 md:pb-20">
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{copy.eyebrow}</p>
        <h1 className="font-display max-w-3xl text-5xl leading-[1.02] italic md:text-8xl">{copy.heading}</h1>
        <p className="max-w-md text-base text-fg-muted md:text-lg">{copy.body}</p>
        <div className="flex flex-wrap items-center gap-3">
          <GlassPillLink href={localizedPath(lang, "/")} size="lg" onImage>
            {copy.home}
          </GlassPillLink>
          <GlassPillLink href={localizedPath(lang, "/work")} size="lg" onImage>
            {nav.work}
          </GlassPillLink>
        </div>
        <p className="font-display text-sm text-fg-muted italic">{site.description}</p>
      </main>
    </div>
  );
}
