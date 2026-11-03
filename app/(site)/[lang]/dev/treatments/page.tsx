import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LogoMask } from "@/components/nav/HomeLink";
import { GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { isLocale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems, type NavItem } from "@/lib/i18n/nav";
import banquet from "@/public/stills/banquet.jpg";
import bouquet from "@/public/stills/bouquet.jpg";
import conservatory from "@/public/stills/conservatory.jpg";
import glow from "@/public/stills/glow.jpg";
import pond from "@/public/stills/pond.jpg";
import supper from "@/public/stills/supper.jpg";
import { SchemeSwitcher } from "../specimen/SchemeSwitcher";
import { QuoteSample } from "./QuoteSample";
import { ASPECTS, aspectLabel, TREATMENTS, treatments, type Treatment } from "./treatments";
import "./treatments.css";

// Sign-off page for the design treatment (issue #50): expressive (live), a middle ground, and cold + clinical, side by
// side and then in full on real-looking surfaces. Unlisted and kept out of search engines, like the other /dev pages.
export const metadata: Metadata = {
  title: "Design treatments",
  robots: { index: false, follow: false },
};

// The clinical treatment's headings. Loaded here only, so the live site doesn't pay for it.
const grotesk = Inter_Tight({ subsets: ["latin", "latin-ext"], variable: "--font-grotesk" });

// Sample copy only: placeholder project titles, as on /dev/specimen.
const projects = [
  { title: "Solas", meta: "Short film · 2026", credit: "Dir. Aoife Ní Bhriain", still: banquet },
  { title: "Bláthanna", meta: "Music video · 2026", credit: "Dir. Cian Ó Sé", still: supper },
  { title: "Last Orders", meta: "Commercial · 2025", credit: "Client: Sample Brand", still: glow },
];

/** Every sample pretends to be on Our Work. */
const CURRENT = "/work";

export default function TreatmentsPage({ params, searchParams }: PageProps<"/[lang]/dev/treatments">) {
  // searchParams is dynamic, so the page streams in behind a boundary.
  return (
    <Suspense>
      <Treatments params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const pick = <T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const first = Array.isArray(value) ? value[0] : value;
  return allowed.find((a) => a === first) ?? fallback;
};

async function Treatments({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const selected = pick((await searchParams).treatment, TREATMENTS, "expressive");
  const dict = await getDictionary(lang);
  const nav = getNavItems(lang, dict).map((item) => ({ ...item, current: item.href.endsWith(CURRENT) }));
  const href = (treatment: Treatment) => `${localizedPath(lang, "/dev/treatments")}?treatment=${treatment}`;

  return (
    <main data-surface="adaptive" className={cn(grotesk.variable, "min-h-dvh bg-bg text-fg")}>
      <div className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <nav aria-label="Treatments" className="flex flex-wrap gap-1.5">
            {TREATMENTS.map((t) => (
              <GlassPillLink key={t} size="sm" scroll={false} href={href(t)} current={t === selected}>
                {treatments[t].letter}
                <span className="max-sm:hidden"> · {treatments[t].title}</span>
              </GlassPillLink>
            ))}
          </nav>
          <SchemeSwitcher />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-10 max-w-3xl">
          <p className="eyebrow">Fiú · dev · issue #50</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Design treatments</h1>
          <p className="mt-3 text-fg-muted">
            Three directions on the same pieces. A is what&rsquo;s live; C is cold and clinical; B splits the difference. Compare
            them side by side, then pick one above to see it in full on the hero, nav, work cards and a form. Light, Dark and
            System switch the adaptive surfaces (Rentals, Contact, forms); the cinematic ones are always dark.
          </p>
        </header>

        <h2 className="mb-4 eyebrow">Side by side</h2>
        {/* Each column spans five shared rows (subgrid), so the heroes, swatches and type line up across them. */}
        <div className="grid gap-4 lg:grid-cols-3">
          {TREATMENTS.map((t) => (
            <Column key={t} treatment={t} href={href(t)} selected={t === selected} nav={nav} />
          ))}
        </div>

        <h2 className="mt-14 mb-4 eyebrow">What differs</h2>
        <div className="overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-40 p-4 font-medium text-fg-muted">
                  <span className="sr-only">Aspect</span>
                </th>
                {TREATMENTS.map((t) => (
                  <th key={t} scope="col" className="p-4 align-bottom font-medium">
                    <span className="text-fg-muted">{treatments[t].letter} · </span>
                    {treatments[t].title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASPECTS.map((aspect) => (
                <tr key={aspect} className="border-b border-line last:border-b-0">
                  <th scope="row" className="p-4 align-top font-medium">
                    {aspectLabel[aspect]}
                  </th>
                  {TREATMENTS.map((t) => (
                    <td key={t} className="p-4 align-top text-fg-muted">
                      {treatments[t].differs[aspect]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FullSurfaces treatment={selected} nav={nav} navLabel={dict.nav.label} />
    </main>
  );
}

type Nav = (NavItem & { current: boolean })[];

/** One treatment in miniature: a hero, its colours, a pair of pills and its type. */
function Column({ treatment, href, selected, nav }: { treatment: Treatment; href: string; selected: boolean; nav: Nav }) {
  const info = treatments[treatment];
  return (
    <section
      data-treatment={treatment}
      aria-labelledby={`col-${treatment}`}
      className="flex flex-col gap-5 rounded-(--radius-card) border border-line bg-bg p-4 text-fg md:p-5 lg:row-span-5 lg:grid lg:grid-rows-subgrid"
    >
      <div>
        <p className="eyebrow">Option {info.letter}</p>
        <h3 id={`col-${treatment}`} className="mt-1 font-display text-3xl">
          {info.title}
        </h3>
        <p className="mt-2 text-sm text-fg-muted">{info.summary}</p>
      </div>

      <div
        data-surface="cinematic"
        className="relative isolate aspect-[4/3] overflow-hidden rounded-(--radius-card) bg-ink text-fg"
      >
        <Still src={conservatory} sizes="(min-width: 1024px) 400px, 100vw" />
        <Rail nav={nav} compact />
        <div className="absolute bottom-4 left-16 [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]">
          <p className="t-title font-display text-3xl">Solas</p>
          <p className="mt-0.5 text-xs text-fg/75">Short film · 2026</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <GlassPillButton size="sm" onImage aria-pressed>
            Our Work
          </GlassPillButton>
          <GlassPillButton size="sm" onImage>
            Talent
          </GlassPillButton>
        </div>
      </div>

      <Swatches />

      <div className="space-y-2">
        <p className="font-display text-3xl leading-tight">
          <span className="t-title">Our Work</span> · Ár gCuid Oibre
        </p>
        <p className="t-slogan font-display text-xl text-fg-muted">Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.</p>
        <p className="text-sm">
          A production company, talent roster and rental house based in Ireland. 4K up to 120p, 12–14 March.
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <GlassPillButton size="sm">Add to quote</GlassPillButton>
        {selected ? (
          <span className="text-sm text-fg-muted">Shown in full below</span>
        ) : (
          <Link href={href} scroll={false} className="text-sm link-quiet">
            See it in full
          </Link>
        )}
      </div>
    </section>
  );
}

const swatches = [
  { label: "Background", className: "bg-bg" },
  { label: "Raised", className: "bg-bg-raised" },
  { label: "Text", className: "bg-fg" },
  { label: "Muted", className: "bg-fg-muted" },
  { label: "Accent", className: "bg-accent" },
  { label: "Ink", className: "bg-ink" },
];

function Swatches() {
  return (
    <ul className="grid grid-cols-6 gap-2">
      {swatches.map((swatch) => (
        <li key={swatch.label} className="min-w-0">
          <span className={cn("block aspect-square rounded-(--radius-field) border border-line", swatch.className)} />
          <span className="mt-1 block truncate text-[0.6875rem] text-fg-muted">{swatch.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** A still with the treatment's grade: a filter on the image and a wash laid over it. */
function Still({ src, sizes, className }: { src: StaticImageData; sizes: string; className?: string }) {
  return (
    <>
      <Image src={src} alt="" fill placeholder="blur" sizes={sizes} className={cn("t-still -z-10 object-cover", className)} />
      <span aria-hidden className="t-wash absolute inset-0 -z-10" />
    </>
  );
}

/** The live side rail (SiteNavClient's <aside>), in place rather than fixed. Labels only; nothing navigates. */
function Rail({ nav, compact, label }: { nav: Nav; compact?: boolean; label?: string }) {
  return (
    <div
      role={label ? "navigation" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "absolute inset-y-0 left-0 z-10 flex w-12 flex-col items-center border-r border-line bg-gradient-to-r from-black/35 to-transparent [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]",
        compact ? "gap-6 pt-4" : "gap-12 pt-7 md:w-16",
      )}
    >
      {/* Sprocket rhythm, as on the live rail. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-[repeating-linear-gradient(to_bottom,currentColor_0_6px,transparent_6px_18px)] text-fg opacity-10"
      />
      <LogoMask className={compact ? "h-5 text-fg" : "h-7 text-fg"} />
      <ul className={cn("flex flex-col items-center", compact ? "gap-4" : "gap-7")}>
        {(compact ? nav.slice(0, 3) : nav).map((item) => (
          <li
            key={item.href}
            aria-current={item.current ? "page" : undefined}
            className={cn(
              "relative rotate-180 font-medium tracking-wide text-fg/60 [writing-mode:vertical-rl] aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-y-0 aria-[current=page]:after:-left-2.5 aria-[current=page]:after:w-px aria-[current=page]:after:bg-(--marker)",
              compact ? "text-[0.6875rem]" : "text-sm",
            )}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The selected treatment on full-size surfaces: Home, the phone nav, Our Work, About and a quote form. */
function FullSurfaces({ treatment, nav, navLabel }: { treatment: Treatment; nav: Nav; navLabel: string }) {
  const info = treatments[treatment];
  return (
    <section data-treatment={treatment} aria-labelledby="full" className="border-t border-line bg-bg text-fg">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="eyebrow">In full · Option {info.letter}</p>
            <h2 id="full" className="mt-2 font-display text-5xl md:text-6xl">
              {info.title}
            </h2>
          </div>
          <p className="max-w-md text-fg-muted">{info.summary}</p>
        </div>

        {/* Home: the rail, the logo and the project caption over a still. */}
        <div
          data-surface="cinematic"
          className="relative isolate aspect-[4/5] overflow-hidden rounded-(--radius-card) bg-ink text-fg sm:aspect-[16/9]"
        >
          <Still src={conservatory} sizes="(min-width: 1280px) 1232px, 100vw" />
          <Rail nav={nav} label={navLabel} />
          <LogoMask className="absolute top-1/2 left-[18%] h-[38%] -translate-y-1/2 text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.3)]" />
          <div className="absolute bottom-6 left-16 [text-shadow:0_1px_6px_rgb(0_0_0/0.35)] md:left-24">
            <p className="t-title font-display text-3xl md:text-5xl">Solas</p>
            <p className="mt-1 text-sm text-fg/75">Short film · 2026 · Dir. Aoife Ní Bhriain</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Phone nav: the bar over a still, and the menu open. */}
          <div className="flex justify-center gap-4 overflow-x-auto">
            <PhoneFrame label="Phone · closed">
              <div data-surface="cinematic" className="relative isolate h-full bg-ink text-fg">
                <Still src={pond} sizes="260px" />
                <div className="flex items-center justify-between px-4 pt-4">
                  <LogoMask className="h-8 text-fg" />
                  <span className="glass glass-on-image grid size-9 place-items-center rounded-full" aria-hidden>
                    <span className="block h-px w-4 bg-current shadow-[0_-5px_0_currentColor,0_5px_0_currentColor]" />
                  </span>
                </div>
                <div className="absolute bottom-5 left-4 [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]">
                  <p className="t-title font-display text-2xl">Bláthanna</p>
                  <p className="text-xs text-fg/75">Music video · 2026</p>
                </div>
              </div>
            </PhoneFrame>
            <PhoneFrame label="Phone · menu open">
              <div className="flex h-full flex-col bg-bg text-fg">
                <div className="flex items-center justify-between px-4 pt-4">
                  <LogoMask className="h-8 text-fg" />
                  <span aria-hidden className="relative block size-5">
                    <span className="absolute top-1/2 left-0 h-px w-5 rotate-45 bg-current" />
                    <span className="absolute top-1/2 left-0 h-px w-5 -rotate-45 bg-current" />
                  </span>
                </div>
                <ul className="flex flex-1 flex-col justify-center gap-0.5 px-4 pb-10">
                  {nav.map((item) => (
                    <li
                      key={item.href}
                      aria-current={item.current ? "page" : undefined}
                      className="py-1 font-display text-4xl tracking-tight text-fg/60 aria-[current=page]:text-fg"
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </PhoneFrame>
          </div>

          {/* Our Work: the list, with the hover fade timed by the treatment. */}
          <div data-surface="cinematic" className="space-y-1 rounded-(--radius-card) bg-ink p-3 text-fg">
            {projects.map((project) => (
              <article
                key={project.title}
                className="group relative isolate overflow-hidden rounded-[calc(var(--radius-card)-4px)] p-5 md:p-7"
              >
                <Still
                  src={project.still}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="opacity-35 transition-opacity duration-(--motion-ms) group-hover:opacity-75 motion-reduce:transition-none"
                />
                <p className="eyebrow text-fg/60">{project.meta}</p>
                <h3 className="t-title mt-2 font-display text-3xl md:text-5xl">{project.title}</h3>
                <p className="mt-1 text-sm text-fg/70">{project.credit}</p>
              </article>
            ))}
          </div>
        </div>

        {/* About: the slogan and manifesto. */}
        <div
          data-surface="cinematic"
          className="relative isolate mt-6 overflow-hidden rounded-(--radius-card) bg-ink p-8 text-fg md:p-12"
        >
          <Still src={supper} sizes="100vw" className="opacity-40 blur-sm" />
          <p lang="ga" className="t-slogan max-w-4xl font-display text-4xl leading-[1.05] md:text-6xl">
            Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.
          </p>
          <p className="mt-3 text-sm text-fg/70">If it&rsquo;s worth doing, it&rsquo;s worth doing right.</p>
          <div className="mt-10 max-w-prose space-y-4 text-[1.0625rem] leading-relaxed text-fg/90">
            <p>
              <strong className="font-semibold text-fg">At Fiú we believe in telling a new generation of stories.</strong>{" "}
              We&rsquo;re a production company, a home for Irish directors, cinematographers and editors, and a rental house for
              the kit we trust on our own sets.
            </p>
          </div>
        </div>

        {/* Rentals: a gear card and the quote form, on the adaptive surface. */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="rounded-(--radius-card) border border-line bg-bg-raised p-6 md:p-8">
            <p className="eyebrow">Camera · Sony</p>
            <h3 className="mt-2 font-display text-3xl">ILME-FX6 Full-Frame Cinema Camera</h3>
            <ul className="mt-5 space-y-2 text-sm text-fg-muted">
              <li>
                <span className="font-medium text-fg">Full-frame 10.2MP</span> sensor with dual base ISO 800 / 12,800
              </li>
              <li>
                <span className="font-medium text-fg">4K up to 120p</span>, internal XAVC and 16-bit RAW out
              </li>
              <li>
                <span className="font-medium text-fg">Electronic variable ND</span> and fast hybrid autofocus
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {["All", "Camera", "Lenses", "Lighting"].map((filter, idx) => (
                <GlassPillButton key={filter} size="sm" data-filter aria-pressed={idx === 1}>
                  {filter}
                </GlassPillButton>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <GlassPillButton>Add to quote</GlassPillButton>
              <span className="text-sm text-fg-muted">Prices on request</span>
            </div>
          </article>

          {/* The photo is a sibling behind the panel: backdrop-filter only affects what is behind an element. */}
          <div className="relative isolate overflow-hidden rounded-(--radius-card) p-4 md:p-6">
            <Still src={bouquet} sizes="50vw" />
            <QuoteSample radius={info.panelRadius} />
          </div>
        </div>

        {/* Scale */}
        <div className="mt-6 rounded-(--radius-card) border border-line p-6 md:p-8">
          <p className="eyebrow">Scale</p>
          <div className="mt-6 space-y-4">
            <p className="font-display text-6xl leading-none md:text-7xl">Fiú Media</p>
            <p className="font-display text-4xl leading-tight md:text-5xl">
              <span className="t-title">Our Work</span> · Ár gCuid Oibre
            </p>
            <p className="font-display text-3xl">Talent, Rentals &amp; Contact</p>
            <p className="max-w-prose text-lg leading-relaxed">
              Body: a production company, talent roster and rental house based in Ireland. We make films, music videos and
              commercials, and we lend out the kit we trust.
            </p>
            <p className="text-sm text-fg-muted">Caption · Fiú Media © 2026, All Rights Reserved</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="shrink-0">
      <div className="h-[30rem] w-[15.5rem] overflow-hidden rounded-[2rem] border border-line shadow-sm">{children}</div>
      <figcaption className="mt-2 text-center text-xs text-fg-muted">{label}</figcaption>
    </figure>
  );
}
