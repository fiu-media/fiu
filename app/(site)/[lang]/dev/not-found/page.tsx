import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { GlassPillLink } from "@/components/ui/Glass";
import { isLocale, localizedPath, type Locale } from "@/lib/i18n/config";
import { OptionA, OptionB, OptionC, type Copy } from "./NotFoundOptions";

// Sign-off page for the custom 404 (issue #56): three layouts, two copy sets. Unlisted and kept
// out of search engines, like /dev/grids.
export const metadata: Metadata = {
  title: "404 options",
  robots: { index: false, follow: false },
};

const OPTIONS = ["a", "b", "c"] as const;
type OptionKey = (typeof OPTIONS)[number];
const COPIES = ["plain", "brand"] as const;
type CopyKey = (typeof COPIES)[number];

// English only for now; the Irish text comes from Fíu once a copy set is picked.
const copies: Record<CopyKey, { label: string; copy: Copy }> = {
  plain: {
    label: "Plain",
    copy: {
      eyebrow: "404",
      heading: "Page not found",
      body: "That page doesn’t exist, or it has moved.",
      home: "Back home",
    },
  },
  brand: {
    label: "On brand",
    copy: {
      eyebrow: "404",
      heading: "Lost the scene",
      body: "We couldn’t find that page. Let’s cut back to the start.",
      home: "Back home",
    },
  },
};

const views: Record<
  OptionKey,
  { title: string; note: string; render: (props: { lang: Locale; copy: Copy }) => ReactNode }
> = {
  a: {
    title: "Cinematic, still behind",
    note: "Always dark with the rail, a home still under a scrim, large italic headline, Home and Our Work links, the Irish slogan as a quiet line. Matches Our Work, Talent and About.",
    render: (props) => <OptionA {...props} />,
  },
  b: {
    title: "Adaptive, type only",
    note: "Follows the system light/dark setting like Contact and Rentals. No image: an oversized ghost 404, headline, Home and Contact links. Lightest to build and load.",
    render: (props) => <OptionB {...props} />,
  },
  c: {
    title: "Cinematic, moving light",
    note: "Dark with a slow drifting patch of light (the #51 experiment). Stands still under prefers-reduced-motion. No image to load.",
    render: (props) => <OptionC {...props} />,
  },
};

const pick = <T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const first = Array.isArray(value) ? value[0] : value;
  return allowed.find((a) => a === first) ?? fallback;
};

export default function NotFoundOptionsPage({ params, searchParams }: PageProps<"/[lang]/dev/not-found">) {
  // searchParams is dynamic, so the page streams in behind a boundary.
  return (
    <Suspense>
      <Options params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Options({
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
  const copyKey = pick(query.copy, COPIES, "plain");
  const view = views[option];

  const href = (o: OptionKey, c: CopyKey) => `${localizedPath(lang, "/dev/not-found")}?option=${o}&copy=${c}`;

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="border-b border-line">
        <nav aria-label="404 options" className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:px-6">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {OPTIONS.map((o) => (
              <GlassPillLink
                key={o}
                size="sm"
                onImage
                scroll={false}
                href={href(o, copyKey)}
                current={o === option}
                aria-label={`${o.toUpperCase()}: ${views[o].title}`}
              >
                {o.toUpperCase()}
                <span className="max-sm:hidden"> · {views[o].title}</span>
              </GlassPillLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {COPIES.map((c) => (
              <GlassPillLink
                key={c}
                size="sm"
                onImage
                scroll={false}
                href={href(option, c)}
                current={c === copyKey}
              >
                Copy: {copies[c].label}
              </GlassPillLink>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <h1 className="sr-only">404 options</h1>
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">
          Option {option.toUpperCase()} · {copies[copyKey].label} copy
        </p>
        <h2 className="font-display mt-1 text-3xl md:text-4xl">{view.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">{view.note}</p>
      </div>

      {/* A transform makes this the containing block for the rail's `fixed` positioning, so the real
          SiteNav previews inside the frame instead of over this page's own chrome. */}
      <div className="mx-auto mb-12 h-[75dvh] max-w-6xl transform-gpu overflow-hidden border-y border-line md:rounded-3xl md:border">
        {view.render({ lang, copy: copies[copyKey].copy })}
      </div>
    </main>
  );
}
