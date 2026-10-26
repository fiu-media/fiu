import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import { GlassNav } from "@/components/nav/GlassNav";
import { GlassPanel, GlassPillButton } from "@/components/ui/Glass";
import logo from "@/public/brand/fiu-logo.png";
import candle from "@/public/stills/candle.jpg";
import flowers from "@/public/stills/flowers.jpg";
import jackets from "@/public/stills/jackets.jpg";
import { pairings, type Pairing } from "./fonts";
import { PairingPanel, PairingSwitcher } from "./PairingTabs";
import { SchemeSwitcher } from "./SchemeSwitcher";

// Public so the team can review it on the production URL while the type pairing (#5) is
// decided. Unlisted: not linked from the site and kept out of search engines.
export const metadata: Metadata = {
  title: "Type & glass specimen",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];
const stills: StaticImageData[] = [candle, flowers, jackets];

// Sample copy only: placeholder project titles and gear from the Canva pack.
const projects = [
  { title: "Solas", meta: "Short film · 2026", credit: "Dir. Aoife Ní Bhriain" },
  { title: "Bláthanna", meta: "Music video · 2026", credit: "Dir. Cian Ó Sé" },
  { title: "Last Orders", meta: "Commercial · 2025", credit: "Client: Sample Brand" },
];

export default function SpecimenPage() {
  return (
    <main data-surface="adaptive" className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <p className="text-sm font-medium">Fíu · type &amp; glass specimen</p>
          <PairingSwitcher pairings={pairings.map(({ id, name }) => ({ id, name }))} />
          <SchemeSwitcher />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-16">
        {pairings.map((p, i) => (
          <PairingPanel key={p.id} id={p.id}>
            <PairingSection pairing={p} still={stills[i % stills.length]} />
          </PairingPanel>
        ))}
      </div>
    </main>
  );
}

function PairingSection({ pairing: p, still }: { pairing: Pairing; still: StaticImageData }) {
  const display = `font-display ${p.displayStyle}`;
  const accent = p.italicAccent ? "italic" : "";

  return (
    <section
      className={`${p.className} font-sans`}
      style={{ "--font-display-face": p.display, "--font-text": p.text } as CSSProperties}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">
            Pairing {p.id.toUpperCase()} · {p.faces}
          </p>
          <h2 className={`${display} mt-2 text-5xl md:text-6xl`}>{p.name}</h2>
        </div>
        <p className="max-w-md text-fg-muted">{p.note}</p>
      </div>

      {/* Home, Mockup 1 layout */}
      <div
        data-surface="cinematic"
        className="relative isolate aspect-[16/9] overflow-hidden rounded-3xl bg-ink text-white"
      >
        <Image src={still} alt="" fill placeholder="blur" sizes="(min-width: 1280px) 1232px, 100vw" className="-z-10 object-cover" />
        <div className="absolute top-5 right-5 hidden sm:block">
          <GlassNav items={nav} onImage current="/work" />
        </div>
        <Image
          src={logo}
          alt="Fíu"
          sizes="40vw"
          className="absolute top-1/2 left-[4%] h-auto w-[42%] -translate-y-1/2"
        />
        <div className="absolute bottom-6 left-6">
          <p className={`${display} ${accent} text-2xl md:text-4xl`}>Solas</p>
          <p className="mt-1 text-sm text-white/75">Short film · 2026</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* About: slogan and manifesto on the cinematic surface */}
        <div
          data-surface="cinematic"
          className="relative isolate overflow-hidden rounded-3xl bg-ink p-8 text-white md:p-12 lg:col-span-3"
        >
          <Image src={still} alt="" fill sizes="60vw" className="-z-10 object-cover opacity-40 blur-sm" />
          <p className={`${display} ${accent} text-4xl leading-[1.05] md:text-6xl`}>
            Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.
          </p>
          <p className="mt-3 text-sm text-white/70">If it&rsquo;s worth doing, it&rsquo;s worth doing right.</p>
          <div className="mt-10 max-w-prose space-y-4 text-[1.0625rem] leading-relaxed text-white/90">
            <p>
              <strong className="font-semibold text-white">
                At Fíu we believe in telling a new generation of stories.
              </strong>{" "}
              We&rsquo;re a production company, a home for Irish directors, cinematographers and editors, and a
              rental house for the kit we trust on our own sets.
            </p>
            <p className="text-white/70">
              Táimid lonnaithe in Éirinn ach ag obair ar fud an domhain: fadas á, é, í, ó, ú render correctly.
            </p>
          </div>
        </div>

        {/* Work list */}
        <div data-surface="cinematic" className="space-y-1 rounded-3xl bg-ink p-4 text-white lg:col-span-2">
          {projects.map((project, idx) => (
            <article key={project.title} className="group relative isolate overflow-hidden rounded-2xl p-5">
              <Image
                src={stills[(idx + 1) % stills.length]}
                alt=""
                fill
                sizes="30vw"
                className="-z-10 object-cover opacity-30 transition-opacity duration-500 group-hover:opacity-70"
              />
              <p className="text-xs tracking-[0.14em] text-white/60 uppercase">{project.meta}</p>
              <h3 className={`${display} ${accent} mt-2 text-3xl md:text-4xl`}>{project.title}</h3>
              <p className="mt-1 text-sm text-white/70">{project.credit}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Rentals: adaptive surface, follows system light/dark */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-bg-raised p-8">
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Camera · Sony</p>
          <h3 className={`${display} mt-2 text-3xl`}>ILME-FX6 Full-Frame Cinema Camera</h3>
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
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GlassPillButton>Add to quote</GlassPillButton>
            <span className="text-sm text-fg-muted">Prices on request</span>
          </div>
        </article>

        {/* The photo is a sibling behind the panel: backdrop-filter only affects what is behind an element. */}
        <div className="relative isolate overflow-hidden rounded-3xl p-4 md:p-6">
          <Image src={flowers} alt="" fill sizes="50vw" className="-z-10 object-cover" />
          <GlassPanel className="p-8">
            <h3 className={`${display} text-3xl`}>Your quote</h3>
            <p className="mt-1 text-sm text-fg-muted">3 items · 12–14 March</p>
            <form className="mt-6 grid gap-3">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Production name</span>
                <input
                  className="h-11 rounded-xl border border-line bg-bg/70 px-3.5 text-fg placeholder:text-fg-muted"
                  placeholder="e.g. Solas, Day 2 pickups"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  className="h-11 rounded-xl border border-line bg-bg/70 px-3.5 text-fg placeholder:text-fg-muted"
                  placeholder="you@example.ie"
                />
              </label>
              <GlassPillButton size="lg" className="mt-3 w-full">
                Request quote
              </GlassPillButton>
            </form>
          </GlassPanel>
        </div>
      </div>

      {/* Scale */}
      <div className="mt-6 rounded-3xl border border-line p-8">
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Scale</p>
        <div className="mt-6 space-y-4">
          <p className={`${display} text-7xl leading-none`}>Fíu Media</p>
          <p className={`${display} ${accent} text-5xl leading-tight`}>Our Work · Ár gCuid Oibre</p>
          <p className={`${display} text-3xl`}>Talent, Rentals &amp; Contact</p>
          <p className="max-w-prose text-lg leading-relaxed">
            Body: a production company, talent roster and rental house based in Ireland. We make films, music
            videos and commercials, and we lend out the kit we trust.
          </p>
          <p className="text-sm text-fg-muted">Caption · Fíu Media © 2026, All Rights Reserved</p>
        </div>
      </div>
    </section>
  );
}
