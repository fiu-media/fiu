"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { SchemeSwitcher } from "../specimen/SchemeSwitcher";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";

export type OptionKey = "a" | "b" | "c" | "d" | "e";
export type Placement = "links" | "bottom";

type Layout = "rail" | "menu";
type SwitcherProps = { layout: Layout; lang: Locale; onChange: (lang: Locale) => void };

const other = (lang: Locale) => locales.find((l) => l !== lang) ?? lang;

/** The rail's own link look, so options that borrow it match the page links exactly. */
const railLink =
  "relative rotate-180 rounded-sm text-sm font-medium tracking-wide text-fg/60 [writing-mode:vertical-rl] hover:text-fg aria-[current=true]:text-fg aria-[current=true]:after:absolute aria-[current=true]:after:inset-y-0 aria-[current=true]:after:-left-2.5 aria-[current=true]:after:w-px aria-[current=true]:after:bg-current";

/** A visible code with the full name after it for assistive tech, so the accessible name still contains what's on screen. */
const Code = ({ lang }: { lang: Locale }) => (
  <>
    <span aria-hidden>{lang.toUpperCase()}</span>
    <span className="sr-only">{localeNames[lang]}</span>
  </>
);

/** A. What is live now: both names, horizontal, current underlined. */
function Words({ layout, lang, onChange }: SwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("flex items-center", layout === "rail" ? "flex-col gap-3 text-xs" : "gap-6 text-lg")}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          onClick={() => onChange(l)}
          className="rounded-sm font-medium tracking-wide text-fg/60 underline-offset-4 hover:text-fg aria-[current=true]:text-fg aria-[current=true]:underline"
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  );
}

/** B. Set vertically like the page links, with the same current-page mark. */
function Vertical({ layout, lang, onChange }: SwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("flex items-center", layout === "rail" ? "flex-col gap-5" : "gap-6 text-lg")}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          onClick={() => onChange(l)}
          className={
            layout === "rail"
              ? railLink
              : "relative rounded-sm font-medium tracking-wide text-fg/60 hover:text-fg aria-[current=true]:text-fg aria-[current=true]:after:absolute aria-[current=true]:after:inset-x-0 aria-[current=true]:after:-bottom-1.5 aria-[current=true]:after:h-px aria-[current=true]:after:bg-current"
          }
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  );
}

/** C. One quiet link to the language you're not on. */
function OtherOnly({ layout, lang, onChange }: SwitcherProps) {
  const target = other(lang);
  return (
    <button
      type="button"
      lang={target}
      onClick={() => onChange(target)}
      className={cn(
        "rounded-sm font-medium tracking-wide text-fg/50 hover:text-fg",
        layout === "rail" ? "rotate-180 text-sm [writing-mode:vertical-rl]" : "text-lg",
      )}
    >
      {localeNames[target]}
    </button>
  );
}

/** D. A small segmented capsule with the thin edge the glass UI uses. */
function Capsule({ layout, lang, onChange }: SwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("flex w-fit rounded-full border border-line p-0.5", layout === "rail" ? "flex-col text-[11px]" : "text-sm")}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          onClick={() => onChange(l)}
          className={cn(
            "grid place-items-center rounded-full font-medium tracking-wider text-fg/60 hover:text-fg aria-[current=true]:bg-fg/12 aria-[current=true]:text-fg",
            layout === "rail" ? "size-7" : "h-8 w-11",
          )}
        >
          <Code lang={l} />
        </button>
      ))}
    </div>
  );
}

/** E. Bare codes with a hairline between them, like the sprocket ticks. */
function Hairline({ layout, lang, onChange }: SwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("flex items-center", layout === "rail" ? "flex-col gap-2 text-xs" : "gap-4 text-base")}
    >
      {locales.map((l, i) => (
        <div key={l} className={cn("flex items-center", layout === "rail" ? "flex-col gap-2" : "gap-4")}>
          {i > 0 && <span aria-hidden className={cn("bg-fg/25", layout === "rail" ? "h-px w-3" : "h-3 w-px")} />}
          <button
            type="button"
            lang={l}
            aria-current={l === lang ? "true" : undefined}
            onClick={() => onChange(l)}
            className="rounded-sm font-medium tracking-[0.14em] text-fg/50 hover:text-fg aria-[current=true]:text-fg"
          >
            <Code lang={l} />
          </button>
        </div>
      ))}
    </div>
  );
}

const switchers: Record<OptionKey, (props: SwitcherProps) => ReactNode> = {
  a: Words,
  b: Vertical,
  c: OtherOnly,
  d: Capsule,
  e: Hairline,
};

type Frame = { surface: "dark" | "adaptive"; layout: Layout; caption: string };

/** Placeholder page behind the nav, so the rail's background treatment reads as it does over the hero. */
const Backdrop = ({ dark }: { dark: boolean }) => (
  <div
    aria-hidden
    className={cn("absolute inset-0", dark ? "bg-gradient-to-br from-stone-500 via-stone-700 to-stone-900" : "bg-bg")}
  >
    {!dark && <div className="absolute inset-x-6 top-24 left-24 h-40 rounded-2xl bg-fg/5" />}
  </div>
);

function Preview({
  option,
  frame,
  placement,
  labels,
  lang,
  setLang,
}: {
  option: OptionKey;
  frame: Frame;
  placement: Placement;
  labels: string[];
  lang: Locale;
  setLang: (lang: Locale) => void;
}) {
  const dark = frame.surface === "dark";
  const Switcher = switchers[option];
  const switcher = <Switcher layout={frame.layout} lang={lang} onChange={setLang} />;

  if (frame.layout === "menu") {
    return (
      <div
        data-surface={dark ? "cinematic" : "adaptive"}
        className={cn(
          "relative h-[40rem] w-[390px] max-w-full overflow-hidden rounded-3xl border border-line text-fg",
          dark ? "bg-ink" : "bg-bg",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="font-display text-2xl">Fiú</span>
          <X aria-hidden className="size-6" />
        </div>
        <nav
          aria-label="Primary"
          className="absolute inset-x-0 top-[4.5rem] bottom-0 flex flex-col justify-center gap-1 px-5 pb-16"
        >
          {labels.map((label, i) => (
            <span key={label} className={cn("py-1 font-display text-4xl tracking-tight", i === 1 ? "text-fg" : "text-fg/60")}>
              {label}
            </span>
          ))}
          <div className="mt-8">{switcher}</div>
        </nav>
      </div>
    );
  }

  return (
    <div
      data-surface={dark ? "cinematic" : "adaptive"}
      className={cn(
        "relative h-[40rem] w-72 max-w-full overflow-hidden rounded-3xl border border-line text-fg",
        dark ? "bg-ink" : "bg-bg",
      )}
    >
      <Backdrop dark={dark} />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-16 flex-col items-center gap-12 border-r border-line pt-7 pb-7",
          dark && "bg-gradient-to-r from-black/35 to-transparent",
        )}
      >
        <span aria-hidden className="font-display text-2xl">
          Fiú
        </span>
        <nav aria-label="Primary" className="flex flex-col items-center gap-7">
          {labels.map((label, i) => (
            <span
              key={label}
              aria-current={i === 1 ? "page" : undefined}
              className="relative rotate-180 text-sm font-medium tracking-wide text-fg/60 [writing-mode:vertical-rl] aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-y-0 aria-[current=page]:after:-left-2.5 aria-[current=page]:after:w-px aria-[current=page]:after:bg-current"
            >
              {label}
            </span>
          ))}
        </nav>
        <div className={placement === "bottom" ? "mt-auto" : undefined}>{switcher}</div>
      </aside>
    </div>
  );
}

const frames: Frame[] = [
  { surface: "dark", layout: "rail", caption: "Rail, over an image (Home, About, Work, Talent)" },
  { surface: "adaptive", layout: "rail", caption: "Rail, adaptive surface (follows the scheme)" },
  { surface: "adaptive", layout: "menu", caption: "Phone menu (follows the scheme)" },
];

export function LanguageConcepts({
  options,
  labels,
  initialLang,
}: {
  options: { key: OptionKey; title: string; note: string }[];
  labels: string[];
  initialLang: Locale;
}) {
  // One language and one placement for the whole page, so every option is compared in the same state.
  const [lang, setLang] = useState<Locale>(initialLang);
  const [placement, setPlacement] = useState<Placement>("links");

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <span className="mr-1 text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Rail placement</span>
        {(["links", "bottom"] as const).map((p) => (
          <GlassPillButton key={p} size="sm" onImage aria-pressed={placement === p} onClick={() => setPlacement(p)}>
            {p === "links" ? "Under the links" : "Bottom of the rail"}
          </GlassPillButton>
        ))}
        <span aria-hidden className="mx-1 h-5 w-px bg-line" />
        <span className="mr-1 text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Scheme</span>
        <SchemeSwitcher />
        <span aria-hidden className="mx-1 h-5 w-px bg-line" />
        <span className="mr-1 text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Current language</span>
        {locales.map((l) => (
          <GlassPillButton key={l} size="sm" onImage aria-pressed={lang === l} onClick={() => setLang(l)}>
            {localeNames[l]}
          </GlassPillButton>
        ))}
      </div>

      <div className="flex flex-col gap-14">
        {options.map(({ key, title, note }) => (
          <section key={key} aria-labelledby={`option-${key}`}>
            <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Option {key.toUpperCase()}</p>
            <h2 id={`option-${key}`} className="mt-1 font-display text-3xl">
              {title}
            </h2>
            <p className="mt-2 mb-5 max-w-2xl text-sm text-fg-muted">{note}</p>
            <div className="flex flex-wrap items-start gap-6">
              {frames.map((frame) => (
                <figure key={`${frame.surface}-${frame.layout}`} className="flex flex-col gap-2">
                  <Preview option={key} frame={frame} placement={placement} labels={labels} lang={lang} setLang={setLang} />
                  <figcaption className="text-xs text-fg-muted">{frame.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
