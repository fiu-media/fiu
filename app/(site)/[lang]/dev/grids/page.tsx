import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { GlassPillButton } from "@/components/ui/Glass";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { projectTypes } from "@/lib/project-types";
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

const people: Sample[] = [
  { still: conservatory, title: "Aoife Ní Bhriain", meta: "Director", ratio: "4/5" },
  { still: fur, title: "Cian Ó Sé", meta: "Director of Photography", ratio: "3/4" },
  { still: supper, title: "Róisín Walsh", meta: "Editor", ratio: "1/1" },
  { still: glow, title: "Donnacha Leahy", meta: "Producer", ratio: "4/5" },
  { still: pond, title: "Méabh Fitzgerald", meta: "Colourist", ratio: "3/4" },
  { still: citrus, title: "Seán Ó Dálaigh", meta: "Sound designer", ratio: "4/5" },
  { still: bouquet, title: "Niamh Brennan", meta: "Production designer", ratio: "1/1" },
  { still: grapes, title: "Pádraig Moran", meta: "Gaffer", ratio: "3/4" },
];

export default async function GridsPage({ params }: PageProps<"/[lang]/dev/grids">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { work } = await getDictionary(lang);

  const chips = (
    <div role="group" aria-label={work.filterLabel} className="mb-8 flex flex-wrap gap-2">
      <GlassPillButton size="sm" onImage aria-pressed>
        {work.all}
      </GlassPillButton>
      {projectTypes.map((type) => (
        <GlassPillButton key={type} size="sm" onImage>
          {work.types[type]}
        </GlassPillButton>
      ))}
    </div>
  );

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink px-4 py-12 text-fg md:px-6">
      <div className="mx-auto max-w-6xl space-y-24">
        <header>
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Issue #9 · sign-off</p>
          <h1 className="font-display mt-2 text-5xl md:text-6xl">Grid options</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Two layouts each for Our Work and Talent, on placeholder content. Hover a tile to see the lift. In the real
            Work grid, tiles with a preview loop also play it on hover.
          </p>
        </header>

        <Option label="Work · option A" title="Uniform tiles" note="Every project is a 16:9 frame. Calm, scannable, rows line up.">
          {chips}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.title}>
                <Tile sample={p} ratio="16/9" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </Option>

        <Option
          label="Work · option B"
          title="Varied-height masonry"
          note="Each cover keeps its own shape (wide, square, tall). More editorial, but rows don't line up."
        >
          {chips}
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {projects.map((p) => (
              <li key={p.title} className="mb-4 break-inside-avoid">
                <Tile sample={p} ratio={p.ratio} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </Option>

        <Option
          label="Talent · option A"
          title="Uniform portraits"
          note="A strict 4:5 portrait grid. Reads like a roster, every person gets the same weight."
        >
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {people.map((p) => (
              <li key={p.title}>
                <Tile sample={p} ratio="4/5" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
              </li>
            ))}
          </ul>
        </Option>

        <Option
          label="Talent · option B"
          title="Staggered portraits"
          note="Portraits at different heights, with alternate columns dropped down. Looser and more editorial."
        >
          <ul className="grid grid-cols-2 items-start gap-4 md:grid-cols-3 lg:grid-cols-4">
            {people.map((p, i) => (
              <li key={p.title} className={i % 2 === 1 ? "mt-10 md:mt-0 md:odd:mt-0 lg:mt-12" : ""}>
                <Tile sample={p} ratio={p.ratio} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
              </li>
            ))}
          </ul>
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

function Tile({ sample, ratio, sizes }: { sample: Sample; ratio: string; sizes: string }) {
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
        <p className="font-display text-xl italic md:text-2xl">{sample.title}</p>
        <p className="mt-0.5 text-sm text-white/75">{sample.meta}</p>
      </div>
    </a>
  );
}
