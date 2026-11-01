import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GlassPillLink } from "@/components/ui/Glass";
import { isLocale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";
import { SchemeSwitcher } from "../specimen/SchemeSwitcher";
import { NavPreview, type OptionKey } from "./NavConcepts";

// Sign-off page for the site navigation: five concepts over placeholder content. Unlisted and kept
// out of search engines, like /dev/grids and /dev/specimen.
export const metadata: Metadata = {
  title: "Navbar options",
  robots: { index: false, follow: false },
};

const OPTIONS = ["a", "b", "c", "d", "e"] as const satisfies readonly OptionKey[];
const SURFACES = ["dark", "light"] as const;
const WIDTHS = ["desktop", "phone"] as const;

const surfaceLabel = { dark: "Dark · cinematic", light: "Light · adaptive" } as const;
const widthLabel = { desktop: "Desktop", phone: "Phone" } as const;

const concepts: Record<OptionKey, { title: string; note: string }> = {
  a: {
    title: "One capsule",
    note: "Logo and links share a single glass bar, so the nav reads as one object. A glass indicator slides to the hovered link and rests on the current page. On phones it folds to logo + Menu, which drops a panel.",
  },
  b: {
    title: "Type only",
    note: "No chrome: the logo and plain links over the image, with a thin underline for the current page. Quietest option. On phones, Menu opens a full-screen overlay with large display links.",
  },
  c: {
    title: "Logo as the menu",
    note: "Only the glass logo stays on screen. Hover (or tap) opens a compact glass menu from it, so the brand is the navigation. Works the same on phones.",
  },
  d: {
    title: "Floating dock",
    note: "Logo alone at the top; the links live in a glass dock at the bottom, within thumb reach on phones. It tucks away as you scroll down and returns on scroll up. Scroll the preview to try it.",
  },
  e: {
    title: "Side rail",
    note: "A slim rail on the left edge: logo at the top, links set vertically. Editorial and out of the way of the imagery. On phones it collapses to a Menu button with a full-screen overlay.",
  },
};

export default function NavbarPage({ params, searchParams }: PageProps<"/[lang]/dev/navbar">) {
  // searchParams is dynamic, so the page streams in behind a boundary.
  return (
    <Suspense>
      <Navbar params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const pick = <T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const first = Array.isArray(value) ? value[0] : value;
  return allowed.find((a) => a === first) ?? fallback;
};

async function Navbar({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const query = await searchParams;
  const option = pick(query.option, OPTIONS, "a");
  const surface = pick(query.surface, SURFACES, "dark");
  const width = pick(query.width, WIDTHS, "desktop");
  const dict = await getDictionary(lang);

  const href = (next: { option?: OptionKey; surface?: (typeof SURFACES)[number]; width?: (typeof WIDTHS)[number] }) => {
    const search = new URLSearchParams({
      option: next.option ?? option,
      surface: next.surface ?? surface,
      width: next.width ?? width,
    });
    return `${localizedPath(lang, "/dev/navbar")}?${search}`;
  };
  const concept = concepts[option];

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-xl">
        <nav aria-label="Navbar options" className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:px-6">
          <div className="-mx-4 flex flex-wrap items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {SURFACES.map((s) => (
              <GlassPillLink key={s} size="sm" onImage scroll={false} href={href({ surface: s })} current={s === surface}>
                {surfaceLabel[s]}
              </GlassPillLink>
            ))}
            <span aria-hidden className="mx-1 h-5 w-px bg-line" />
            {WIDTHS.map((w) => (
              <GlassPillLink key={w} size="sm" onImage scroll={false} href={href({ width: w })} current={w === width}>
                {widthLabel[w]}
              </GlassPillLink>
            ))}
            {surface === "light" && (
              <>
                <span aria-hidden className="mx-1 h-5 w-px bg-line" />
                <SchemeSwitcher />
              </>
            )}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {OPTIONS.map((o) => (
              <GlassPillLink
                key={o}
                size="sm"
                onImage
                scroll={false}
                href={href({ option: o })}
                current={o === option}
                aria-label={`${o.toUpperCase()}: ${concepts[o].title}`}
              >
                {o.toUpperCase()}
                <span className="max-sm:hidden"> · {concepts[o].title}</span>
              </GlassPillLink>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
        <h1 className="sr-only">Navbar options</h1>
        <div className="mb-4 border-b border-line pb-3">
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Option {option.toUpperCase()}</p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">{concept.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{concept.note}</p>
        </div>
        <NavPreview
          key={`${option}-${width}`}
          option={option}
          surface={surface}
          width={width}
          items={getNavItems(lang, dict)}
          homeLabel={dict.nav.home}
        />
      </div>
    </main>
  );
}
