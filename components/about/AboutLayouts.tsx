import Image from "next/image";
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import type { SizedImage } from "@/sanity/lib/rentals";

export type AboutLayoutProps = {
  still: SizedImage;
  slogan: string | null;
  gloss: string | null;
  manifesto: ReactNode;
  contacts: ReactNode;
  footer: ReactNode;
  /** `data-sanity` values that make the parts clickable in the Presentation tool. */
  attributes?: { still?: string; slogan?: string; manifesto?: string };
};

function Still({ still, attribute, className }: { still: SizedImage; attribute?: string; className?: string }) {
  return (
    <Image
      src={still.src}
      width={still.width}
      height={still.height}
      alt={still.alt}
      sizes="100vw"
      priority
      placeholder={still.blurDataURL ? "blur" : "empty"}
      blurDataURL={still.blurDataURL}
      data-sanity={attribute}
      style={{ objectPosition: still.position }}
      className={cn("size-full object-cover", className)}
    />
  );
}

/**
 * Option A, "Slogan first": the still holds the first screen with the slogan large over it. The
 * manifesto, contact links and footer follow on plain dark, so no running text sits over the photo.
 */
export function AboutLayoutA({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative text-white">
      <div className="sticky top-0 -z-10 h-dvh">
        <Still still={still} attribute={attributes?.still} />
      </div>

      <section className="relative -mt-[100dvh] flex h-dvh flex-col justify-end bg-gradient-to-t from-black/75 via-black/20 to-black/35 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
        <h1
          data-sanity={attributes?.slogan}
          className="font-display max-w-5xl text-5xl leading-[1.02] text-balance italic md:text-8xl"
        >
          {slogan}
        </h1>
        {gloss && <p className="mt-4 max-w-xl text-base text-white/80 md:text-lg">{gloss}</p>}
        <p aria-hidden className="mt-8 text-sm text-white/60">
          ↓
        </p>
      </section>

      <section className="relative bg-ink px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto flex max-w-3xl flex-col gap-14">
          {manifesto && (
            <div
              data-sanity={attributes?.manifesto}
              className="space-y-6 text-xl leading-relaxed text-white/85 md:text-2xl"
            >
              {manifesto}
            </div>
          )}
          {contacts}
          {footer}
        </div>
      </section>
    </main>
  );
}

/**
 * Option B, "Split screen": the slogan, manifesto, contact links and footer sit in a solid dark
 * column beside the still, which stays clean on the right. On phones the still comes first and the
 * column follows below it.
 */
export function AboutLayoutB({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-ink text-white md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-20">
        <div className="flex max-w-xl flex-col gap-10">
          <header>
            <h1
              data-sanity={attributes?.slogan}
              className="font-display text-4xl leading-[1.05] text-balance italic md:text-5xl lg:text-6xl"
            >
              {slogan}
            </h1>
            {gloss && <p className="mt-3 text-base text-white/70">{gloss}</p>}
          </header>
          <div
            data-sanity={attributes?.manifesto}
            className="space-y-4 text-base leading-relaxed text-white/85 md:text-lg"
          >
            {manifesto}
          </div>
          {contacts}
          {footer}
        </div>
      </div>

      <div className="relative h-[60dvh] max-md:order-first md:sticky md:top-0 md:h-dvh">
        <Still still={still} attribute={attributes?.still} />
      </div>
    </main>
  );
}

/**
 * Option C, "Letterbox": one screen, like a film frame. The slogan sits above a wide band of the
 * still, with the manifesto and the contact links below it on plain dark.
 */
export function AboutLayoutC({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative flex min-h-dvh flex-col justify-center gap-8 bg-ink px-5 py-24 text-white md:gap-10 md:px-10 md:py-16">
      <header className="max-w-5xl">
        <h1
          data-sanity={attributes?.slogan}
          className="font-display text-3xl leading-[1.05] text-balance italic md:text-5xl"
        >
          {slogan}
        </h1>
        {gloss && <p className="mt-3 text-base text-white/70">{gloss}</p>}
      </header>
      <div className="relative h-[34dvh] overflow-hidden rounded-2xl md:h-[40dvh]">
        <Still still={still} attribute={attributes?.still} />
      </div>
      <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-14">
        <div
          data-sanity={attributes?.manifesto}
          className="space-y-4 text-base leading-relaxed text-white/85 md:text-lg"
        >
          {manifesto}
        </div>
        <div className="flex flex-col gap-8 md:justify-between">
          {contacts}
          {footer}
        </div>
      </div>
    </main>
  );
}

/**
 * Option D, "Poster": the still has the first screen to itself, with nothing over it. The slogan,
 * manifesto, contact links and footer follow below on plain dark, in two columns on desktop.
 */
export function AboutLayoutD({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative bg-ink text-white">
      <div className="relative h-dvh">
        <Still still={still} attribute={attributes?.still} />
      </div>
      <section className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-16">
          <header>
            <h1
              data-sanity={attributes?.slogan}
              className="font-display text-4xl leading-[1.05] text-balance italic md:text-6xl"
            >
              {slogan}
            </h1>
            {gloss && <p className="mt-4 text-base text-white/70 md:text-lg">{gloss}</p>}
          </header>
          <div className="flex flex-col gap-10">
            <div
              data-sanity={attributes?.manifesto}
              className="space-y-4 text-base leading-relaxed text-white/85 md:text-lg"
            >
              {manifesto}
            </div>
            {contacts}
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Option E, "Statement": type first. The slogan fills the first screen on plain dark, the still
 * follows as a framed print, then the manifesto in two columns with the contact links.
 */
export function AboutLayoutE({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative bg-ink px-5 text-white md:px-10">
      <section className="flex min-h-dvh flex-col justify-center py-24 md:py-16">
        <h1
          data-sanity={attributes?.slogan}
          className="font-display max-w-6xl text-5xl leading-[1.02] text-balance italic md:text-8xl"
        >
          {slogan}
        </h1>
        {gloss && <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">{gloss}</p>}
      </section>
      <div className="mx-auto max-w-6xl">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:aspect-[16/9]">
          <Still still={still} attribute={attributes?.still} />
        </div>
      </div>
      <section className="mx-auto grid max-w-6xl gap-10 py-20 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-16 md:py-28">
        <div data-sanity={attributes?.manifesto} className="space-y-5 text-lg leading-relaxed text-white/85 md:text-xl">
          {manifesto}
        </div>
        <div className="flex flex-col gap-10">
          {contacts}
          {footer}
        </div>
      </section>
    </main>
  );
}

/**
 * Option F, "Glass caption": the full-bleed still with only the short slogan in a small clear-glass
 * card, like a film title card. The manifesto, contact links and footer follow on plain dark.
 */
export function AboutLayoutF({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative bg-ink text-white">
      <section className="relative isolate flex h-dvh items-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-14">
        <div className="absolute inset-0 -z-10">
          <Still still={still} attribute={attributes?.still} />
        </div>
        <GlassPanel onImage className="max-w-2xl p-6 md:p-9">
          <h1
            data-sanity={attributes?.slogan}
            className="font-display text-3xl leading-[1.08] text-balance italic md:text-5xl"
          >
            {slogan}
          </h1>
          {gloss && <p className="mt-3 text-base text-white/80">{gloss}</p>}
        </GlassPanel>
      </section>
      <section className="px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto flex max-w-3xl flex-col gap-14">
          <div
            data-sanity={attributes?.manifesto}
            className="space-y-6 text-xl leading-relaxed text-white/85 md:text-2xl"
          >
            {manifesto}
          </div>
          {contacts}
          {footer}
        </div>
      </section>
    </main>
  );
}
