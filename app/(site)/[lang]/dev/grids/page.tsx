import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { isLocale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { IndexList } from "./IndexList";
import banquet from "@/public/stills/banquet.jpg";
import bouquet from "@/public/stills/bouquet.jpg";
import citrus from "@/public/stills/citrus.jpg";
import conservatory from "@/public/stills/conservatory.jpg";
import fur from "@/public/stills/fur.jpg";
import glow from "@/public/stills/glow.jpg";
import grapes from "@/public/stills/grapes.jpg";
import pond from "@/public/stills/pond.jpg";
import supper from "@/public/stills/supper.jpg";

// Sign-off page for the Our Work and Talent grids (issue #9): two options each, on placeholder
// content. Unlisted and kept out of search engines, like /dev/specimen.
export const metadata: Metadata = {
  title: "Grid options",
  robots: { index: false, follow: false },
};

// Filter chips on placeholder content; the real ones come from the project type documents.
const typeChips = ["Originals", "Commercial", "Music videos", "Shorts", "Documentaries"];

type Sample = { still: StaticImageData; title: string; meta: string; ratio: string };

// The cover stills are all roughly 16:9; the `ratio` crops them the way real covers of different
// shapes would look, so the masonry options have something to vary.
const projects: Sample[] = [
  { still: conservatory, title: "Solas", meta: "Short · 2026", ratio: "16/9" },
  { still: banquet, title: "Bláthanna", meta: "Music video · 2026", ratio: "4/5" },
  { still: supper, title: "Last Orders", meta: "Commercial · 2025", ratio: "1/1" },
  { still: glow, title: "Tine", meta: "Original · 2025", ratio: "16/9" },
  { still: citrus, title: "Silín", meta: "Commercial · 2025", ratio: "3/4" },
  { still: bouquet, title: "Fáinne", meta: "Music video · 2024", ratio: "16/10" },
  { still: grapes, title: "Fómhar", meta: "Documentary · 2024", ratio: "1/1" },
  { still: pond, title: "Lochán", meta: "Short · 2023", ratio: "4/5" },
  { still: fur, title: "Olann", meta: "Original · 2023", ratio: "16/9" },
];

// Ratios are rotated so each column of the staggered grid mixes portrait and square frames.
const people: Sample[] = [
  { still: conservatory, title: "Aoife Ní Bhriain", meta: "Director", ratio: "4/5" },
  { still: fur, title: "Cian Ó Sé", meta: "Director of Photography", ratio: "1/1" },
  { still: supper, title: "Róisín Walsh", meta: "Editor", ratio: "3/4" },
  { still: glow, title: "Donnacha Leahy", meta: "Producer", ratio: "4/5" },
  { still: pond, title: "Méabh Fitzgerald", meta: "Colourist", ratio: "1/1" },
  { still: citrus, title: "Seán Ó Dálaigh", meta: "Sound designer", ratio: "4/5" },
  { still: bouquet, title: "Niamh Brennan", meta: "Production designer", ratio: "4/5" },
  { still: grapes, title: "Pádraig Moran", meta: "Gaffer", ratio: "3/4" },
];

const PAGES = ["work", "talent"] as const;
type PageKey = (typeof PAGES)[number];
const OPTIONS = ["a", "b", "c", "d", "e"] as const;
type OptionKey = (typeof OPTIONS)[number];

const pageLabel: Record<PageKey, string> = { work: "Our Work", talent: "Talent" };

type View = { title: string; note: string; content: ReactNode };

export default function GridsPage({ params, searchParams }: PageProps<"/[lang]/dev/grids">) {
  // searchParams is dynamic, so the page streams in behind a boundary.
  return (
    <Suspense>
      <Grids params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const pick = <T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const first = Array.isArray(value) ? value[0] : value;
  return allowed.find((a) => a === first) ?? fallback;
};

async function Grids({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const query = await searchParams;
  const page = pick(query.page, PAGES, "work");
  const option = pick(query.option, OPTIONS, "a");
  const { work } = await getDictionary(lang);

  const chips = (
    <div role="group" aria-label={work.filterLabel} className="mb-8 flex flex-wrap gap-2">
      <GlassPillButton size="sm" onImage aria-pressed>
        {work.all}
      </GlassPillButton>
      {typeChips.map((label) => (
        <GlassPillButton key={label} size="sm" onImage>
          {label}
        </GlassPillButton>
      ))}
    </div>
  );

  const views: Record<PageKey, Record<OptionKey, View>> = {
    work: {
      a: {
        title: "Uniform tiles",
        note: "Every project is a 16:9 frame. Calm, scannable, rows line up.",
        content: (
          <>
            {chips}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.title}>
                  <Tile sample={p} ratio="16/9" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          </>
        ),
      },
      b: {
        title: "Varied-height masonry",
        note: "Each cover keeps its own shape (wide, square, tall). More editorial, but rows don't line up.",
        content: (
          <>
            {chips}
            <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {projects.map((p) => (
                <li key={p.title} className="mb-4 break-inside-avoid">
                  <Tile sample={p} ratio={p.ratio} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          </>
        ),
      },
      c: {
        title: "Index list",
        note: "Big titles in rows with type, year and client. The cover follows the cursor on hover (thumbnails on touch). Scales to a long back catalogue.",
        content: (
          <>
            {chips}
            <IndexList
              items={projects.map((p) => ({ title: p.title, meta: p.meta, still: p.still }))}
              ratio="16/9"
              previewWidth={320}
            />
          </>
        ),
      },
      d: {
        title: "Featured hero + grid",
        note: "The featured project runs full-width, then the rest in a calm uniform grid. The real page will use the Featured flag.",
        content: (
          <>
            {chips}
            <div className="space-y-4">
              <Tile sample={projects[0]} ratio="21/9" large sizes="(min-width: 1152px) 1152px, 100vw" />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.slice(1).map((p) => (
                  <li key={p.title}>
                    <Tile sample={p} ratio="16/9" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ),
      },
      e: {
        title: "Full-bleed scroll",
        note: "One project per screen with snap scrolling, like the Home hero. Scroll inside the frame. Striking, but best for a short list.",
        content: (
          <>
            <div
              tabIndex={0}
              role="region"
              aria-label="Full-bleed scroll preview"
              className="h-[70vh] snap-y snap-mandatory overflow-y-auto rounded-2xl"
            >
              {projects.slice(0, 5).map((p) => (
                <a key={p.title} href="#" className="group relative isolate block h-full snap-start overflow-hidden">
                  <Image
                    src={p.still}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1152px) 1152px, 100vw"
                    className="-z-10 object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white md:bottom-10 md:left-10">
                    <p className="font-display text-4xl italic md:text-7xl">{p.title}</p>
                    <p className="mt-1 text-sm text-white/75 md:text-base">{p.meta}</p>
                  </div>
                </a>
              ))}
            </div>
          </>
        ),
      },
    },
    talent: {
      a: {
        title: "Uniform portraits",
        note: "A strict 4:5 portrait grid. Reads like a roster, every person gets the same weight.",
        content: (
          <>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {people.map((p) => (
                <li key={p.title}>
                  <Tile sample={p} ratio="4/5" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                </li>
              ))}
            </ul>
          </>
        ),
      },
      b: {
        title: "Staggered portraits",
        note: "Portraits at different heights, with alternate columns dropped down. Looser and more editorial.",
        content: (
          <>
            <ul className="grid grid-cols-2 items-start gap-4 md:grid-cols-3 lg:grid-cols-4">
              {people.map((p) => (
                <li key={p.title} className="max-md:even:mt-10 md:max-lg:nth-[3n+2]:mt-10 lg:even:mt-12">
                  <Tile sample={p} ratio={p.ratio} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                </li>
              ))}
            </ul>
          </>
        ),
      },
      c: {
        title: "Name index",
        note: "Names in large type; the portrait follows the cursor (thumbnails on touch). Suits a small, established roster.",
        content: (
          <>
            <IndexList
              items={people.map((p) => ({ title: p.title, meta: p.meta, still: p.still }))}
              ratio="4/5"
              previewWidth={220}
            />
          </>
        ),
      },
      d: {
        title: "Large two-up",
        note: "Fewer, bigger portraits with the role overlaid. A more premium feel if the roster stays under about a dozen.",
        content: (
          <>
            <ul className="grid gap-4 sm:grid-cols-2">
              {people.slice(0, 4).map((p) => (
                <li key={p.title}>
                  <Tile sample={p} ratio="4/5" large sizes="(min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          </>
        ),
      },
      e: {
        title: "Hover reveal",
        note: "Name only at rest; the role and a showreel loop (placeholder here) fade in on hover or focus. On touch the role is always shown.",
        content: (
          <>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {people.map((p, i) => (
                <li key={p.title}>
                  <RevealTile sample={p} alt={people[(i + 3) % people.length].still} />
                </li>
              ))}
            </ul>
          </>
        ),
      },
    },
  };

  const href = (p: PageKey, o: OptionKey) => `${localizedPath(lang, "/dev/grids")}?page=${p}&option=${o}`;
  const view = views[page][option];

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl">
        <nav aria-label="Grid options" className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:px-6">
          <div className="flex flex-wrap gap-2">
            {PAGES.map((p) => (
              <GlassPillLink key={p} size="sm" onImage scroll={false} href={href(p, option)} current={p === page}>
                {pageLabel[p]}
              </GlassPillLink>
            ))}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {OPTIONS.map((o) => (
              <GlassPillLink
                key={o}
                size="sm"
                onImage
                scroll={false}
                href={href(page, o)}
                current={o === option}
                aria-label={`${o.toUpperCase()}: ${views[page][o].title}`}
              >
                {o.toUpperCase()}
                <span className="max-sm:hidden"> · {views[page][o].title}</span>
              </GlassPillLink>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h1 className="sr-only">Grid options</h1>
        <Option label={`${pageLabel[page]} · option ${option.toUpperCase()}`} title={view.title} note={view.note}>
          {view.content}
        </Option>
      </div>
    </main>
  );
}

function Option({ label, title, note, children }: { label: string; title: string; note: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-6 border-b border-line pb-4">
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{label}</p>
        <h2 className="font-display mt-1 text-3xl md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-fg-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Tile({ sample, ratio, sizes, large }: { sample: Sample; ratio: string; sizes: string; large?: boolean }) {
  return (
    <a
      href="#"
      className="group relative isolate block overflow-hidden rounded-2xl bg-bg-raised"
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={sample.still}
        alt=""
        fill
        placeholder="blur"
        sizes={sizes}
        className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
        <p className={`font-display italic ${large ? "text-3xl md:text-5xl" : "text-xl md:text-2xl"}`}>
          {sample.title}
        </p>
        <p className={`mt-0.5 text-white/75 ${large ? "text-base" : "text-sm"}`}>{sample.meta}</p>
      </div>
    </a>
  );
}

/** Option E for Talent: name at rest, role and a (placeholder) showreel loop on hover or focus. */
function RevealTile({ sample, alt }: { sample: Sample; alt: StaticImageData }) {
  const reveal =
    "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none";
  return (
    <a href="#" className="group relative isolate block aspect-[4/5] overflow-hidden rounded-2xl bg-bg-raised">
      <Image
        src={sample.still}
        alt=""
        fill
        placeholder="blur"
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        className="-z-20 object-cover"
      />
      <Image
        src={alt}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        className={`-z-10 object-cover pointer-coarse:hidden ${reveal}`}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
        <p className="font-display text-xl italic md:text-2xl">{sample.title}</p>
        <p className={`mt-0.5 text-sm text-white/75 ${reveal}`}>{sample.meta} · Showreel</p>
      </div>
    </a>
  );
}
