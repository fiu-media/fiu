import Image from "next/image";
import { SiteNav } from "@/components/nav/SiteNav";
import { railInset } from "@/components/nav/rail";
import { GlassPillLink } from "@/components/ui/Glass";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

import glow from "@/public/stills/glow.jpg";

export type Copy = { eyebrow: string; heading: string; body: string; home: string };

type Props = { lang: Locale; copy: Copy };

// Each option is a whole page: the real SiteNav plus the 404 content, laid out the way the final
// `not-found.tsx` would be. The preview frame in page.tsx contains the fixed rail.

/** A · Cinematic: always dark, a home still behind a scrim. */
export async function OptionA({ lang, copy }: Props) {
  const { site, nav } = await getDictionary(lang);
  return (
    <div data-surface="cinematic" className={`relative isolate h-full overflow-hidden bg-ink text-fg ${railInset}`}>
      <Image
        src={glow}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      <SiteNav lang={lang} onImage />
      <main className="flex h-full flex-col justify-end gap-6 px-6 pt-24 pb-14 md:px-12 md:pb-20">
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

/** B · Adaptive: follows the system light/dark setting, type only. */
export async function OptionB({ lang, copy }: Props) {
  const { nav } = await getDictionary(lang);
  return (
    <div data-surface="adaptive" className={`h-full overflow-hidden bg-bg text-fg ${railInset}`}>
      <SiteNav lang={lang} />
      <main className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-6 px-6 pt-24 pb-14 md:px-12 md:pt-0">
        <p aria-hidden className="font-display text-[clamp(7rem,28vw,18rem)] leading-[0.8] text-fg/10">
          404
        </p>
        <h1 className="font-display -mt-4 text-4xl md:-mt-10 md:text-6xl">{copy.heading}</h1>
        <p className="max-w-md text-base text-fg-muted md:text-lg">{copy.body}</p>
        <div className="flex flex-wrap items-center gap-3">
          <GlassPillLink href={localizedPath(lang, "/")} size="lg">
            {copy.home}
          </GlassPillLink>
          <GlassPillLink href={localizedPath(lang, "/contact")} size="lg">
            {nav.contact}
          </GlassPillLink>
        </div>
      </main>
    </div>
  );
}

/** C · Cinematic with a slowly drifting patch of light (the #51 experiment); still when motion is reduced. */
export async function OptionC({ lang, copy }: Props) {
  const { site } = await getDictionary(lang);
  return (
    <div data-surface="cinematic" className={`relative isolate h-full overflow-hidden bg-ink text-fg ${railInset}`}>
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 h-[150%] w-3/4 animate-[light-drift_26s_ease-in-out_infinite_alternate] rounded-full bg-[radial-gradient(closest-side,rgb(214_160_110/0.38),transparent)] blur-3xl motion-reduce:animate-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>
      <SiteNav lang={lang} onImage />
      <main className="flex h-full flex-col justify-center gap-6 px-6 pt-24 pb-14 md:px-12 md:pt-0">
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{copy.eyebrow}</p>
        <h1 className="font-display max-w-3xl text-5xl leading-[1.02] md:text-8xl">{copy.heading}</h1>
        <p className="max-w-md text-base text-fg-muted md:text-lg">{copy.body}</p>
        <div>
          <GlassPillLink href={localizedPath(lang, "/")} size="lg" onImage>
            {copy.home}
          </GlassPillLink>
        </div>
        <p className="font-display text-sm text-fg-muted italic">{site.description}</p>
      </main>
    </div>
  );
}
