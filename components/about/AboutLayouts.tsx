import Image from "next/image";
import type { ReactNode } from "react";
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

function Still({ still, attribute, className = "" }: { still: SizedImage; attribute?: string; className?: string }) {
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
      className={`size-full object-cover ${className}`}
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
