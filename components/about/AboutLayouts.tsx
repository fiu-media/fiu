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

/** Room beside the side rail, for fixed backgrounds that must not slide under it. */
const BESIDE_RAIL = "inset-y-0 right-0 left-0 md:left-[calc(4rem+env(safe-area-inset-left))]";

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
 * Option A, "Slogan first": the still holds the first screen with the slogan large over it. Scrolling
 * slides the manifesto up over a darkening still, with the contact links and footer at the end.
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

      <section className="relative min-h-dvh bg-gradient-to-b from-black/75 via-black/85 to-black px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <div
            data-sanity={attributes?.manifesto}
            className="space-y-6 text-xl leading-relaxed text-white/90 md:text-2xl"
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
 * Option B, "One screen": a single composition. The still fills the screen, darkening to the left
 * where the slogan, manifesto, contact links and footer sit in one column. On phones the column
 * stacks over the still and scrolls.
 */
export function AboutLayoutB({ still, slogan, gloss, manifesto, contacts, footer, attributes }: AboutLayoutProps) {
  return (
    <main className="relative min-h-dvh text-white">
      <div className={`fixed ${BESIDE_RAIL} -z-10`}>
        <Still still={still} attribute={attributes?.still} />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/10 max-md:bg-black/70"
        />
      </div>

      <div className="flex min-h-dvh flex-col justify-center px-5 py-24 md:px-10 md:py-16">
        <div className="flex max-w-xl flex-col gap-8">
          <header>
            <h1
              data-sanity={attributes?.slogan}
              className="font-display text-4xl leading-[1.05] text-balance italic md:text-6xl"
            >
              {slogan}
            </h1>
            {gloss && <p className="mt-3 text-base text-white/75">{gloss}</p>}
          </header>
          <div
            data-sanity={attributes?.manifesto}
            className="space-y-4 text-base leading-relaxed text-white/90 md:text-lg"
          >
            {manifesto}
          </div>
          {contacts}
          {footer}
        </div>
      </div>
    </main>
  );
}
