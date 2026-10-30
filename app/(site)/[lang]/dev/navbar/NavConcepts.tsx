"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { LogoMask } from "@/components/nav/HomeLink";
import type { NavItem } from "@/lib/i18n/nav";
import { GlassPanel, GlassPillButton } from "@/components/ui/Glass";
import conservatory from "@/public/stills/conservatory.jpg";
import glow from "@/public/stills/glow.jpg";
import pond from "@/public/stills/pond.jpg";
import supper from "@/public/stills/supper.jpg";

export type OptionKey = "a" | "b" | "c" | "d" | "e";

type Concept = {
  items: NavItem[];
  current: string;
  onSelect: (href: string) => void;
  homeLabel: string;
  /** The preview's scroll container, for the dock that reacts to scrolling. */
  scroller: RefObject<HTMLDivElement | null>;
  /** Dark surface: the nav sits over photography and uses light-on-dark glass. */
  onImage: boolean;
};

/**
 * One frame per option. The frame is a size container, so the `@2xl:` variants below follow the
 * frame's width, not the browser's. That lets the Phone toggle show the mobile layout on a desktop.
 */
export function NavPreview({
  option,
  surface,
  width,
  items,
  homeLabel,
}: {
  option: OptionKey;
  surface: "dark" | "light";
  width: "desktop" | "phone";
  items: NavItem[];
  homeLabel: string;
}) {
  const dark = surface === "dark";
  const scroller = useRef<HTMLDivElement>(null);
  // Start on "Our Work" so the current-page state is visible; clicking a link moves it.
  const [current, setCurrent] = useState(items[1]?.href ?? "");
  const concept: Concept = { items, current, onSelect: setCurrent, homeLabel, scroller, onImage: dark };

  return (
    <div
      data-surface={dark ? "cinematic" : "adaptive"}
      style={{ "--frame-h": "max(28rem, calc(100dvh - 20rem))" } as CSSProperties}
      className={`@container relative mx-auto h-(--frame-h) overflow-hidden rounded-3xl border border-line text-fg ${
        dark ? "bg-ink" : "bg-bg"
      } ${width === "phone" ? "w-[390px] max-w-full" : "w-full"}`}
    >
      {/* The rail sits on the left edge, so the content makes room for it like a real page would. */}
      <div
        ref={scroller}
        className={`absolute inset-0 overflow-y-auto overscroll-contain ${option === "e" ? "@2xl:pl-16" : ""}`}
      >
        <Content dark={dark} dockRoom={option === "d"} phone={width === "phone"} />
      </div>
      {option === "a" && <Capsule {...concept} />}
      {option === "b" && <TypeOnly {...concept} />}
      {option === "c" && <LogoMenu {...concept} />}
      {option === "d" && <Dock {...concept} />}
      {option === "e" && <Rail {...concept} />}
    </div>
  );
}

/** Stand-in page content so each nav is judged over real stills. Long enough to scroll. */
function Content({ dark, dockRoom, phone }: { dark: boolean; dockRoom: boolean; phone: boolean }) {
  // The frame is 390px in phone mode, otherwise the page column (max-w-6xl, 1152px, with page padding).
  const frameSizes = phone ? "390px" : "(min-width: 1200px) 1152px, calc(100vw - 3rem)";
  const tileSizes = phone
    ? "390px"
    : "(min-width: 1200px) 370px, (min-width: 720px) calc((100vw - 3rem) / 3), calc(100vw - 2rem)";
  const hero = (
    <div className={`relative z-10 flex h-full flex-col justify-end p-5 @2xl:p-10 ${dockRoom ? "pb-24" : "pb-8 @2xl:pb-12"}`}>
      <p className="font-display text-5xl tracking-tight text-white @2xl:text-7xl">Stories worth watching</p>
      <p className="mt-3 max-w-md text-sm text-white/80 @2xl:text-base">
        Placeholder hero. Judge the nav against the image behind it, not the words.
      </p>
    </div>
  );
  return (
    <>
      <section className="relative h-(--frame-h)">
        {dark ? (
          <>
            <Image src={conservatory} alt="" fill priority placeholder="blur" sizes={frameSizes} className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {hero}
          </>
        ) : (
          <div className="flex h-full flex-col px-3 pt-24 pb-3 @2xl:px-6">
            <p className="font-display px-2 pb-4 text-4xl tracking-tight @2xl:text-6xl">Stories worth watching</p>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
              <Image src={conservatory} alt="" fill placeholder="blur" sizes={frameSizes} className="object-cover" />
            </div>
          </div>
        )}
      </section>
      <section className="grid gap-3 p-3 @2xl:grid-cols-3 @2xl:p-6">
        {[glow, pond, supper].map((still, i) => (
          <div key={i} className="relative aspect-[16/10] overflow-hidden rounded-2xl">
            <Image src={still} alt="" fill placeholder="blur" sizes={tileSizes} className="object-cover" />
          </div>
        ))}
      </section>
      <div className="h-24" />
    </>
  );
}

/** Open state with Escape and click-outside to close. Attach `ref` to the element that owns the menu. */
function useMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  return { ref, open, setOpen };
}

/** Preview links go nowhere; clicking only moves the "current page" state so it can be judged. */
function NavLink({
  item,
  current,
  onSelect,
  className,
  children,
}: {
  item: NavItem;
  current: string;
  onSelect: (href: string) => void;
  className: string;
  children?: ReactNode;
}) {
  return (
    <a
      href="#"
      aria-current={item.href === current ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        onSelect(item.href);
      }}
      className={className}
    >
      {children ?? item.label}
    </a>
  );
}

function Logo({ label, className }: { label: string; className: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      onClick={(event) => event.preventDefault()}
      className="block shrink-0 rounded-md"
    >
      <LogoMask className={className} />
    </a>
  );
}

/** Two quiet lines that fold into a cross while the menu is open. */
function MenuIcon({ open = false, className = "" }: { open?: boolean; className?: string }) {
  const line = "origin-center [transform-box:fill-box] transition-transform duration-300";
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className={`size-6 ${className}`}
    >
      <line x1="5" x2="19" y1="8" y2="8" className={`${line} ${open ? "translate-y-[4px] rotate-45" : ""}`} />
      <line x1="5" x2="19" y1="16" y2="16" className={`${line} ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
    </svg>
  );
}

/*
 * Dropdowns hold glass, and a backdrop-filter only sees what is behind it inside its nearest
 * "backdrop root". Anything below full opacity (also filter, mask, clip-path) makes its element
 * one, so fading the wrapper left the glass with nothing to bend and it flashed black. The wrapper
 * therefore moves with transform and visibility only; the links inside fade instead.
 */
const dropdown = "transition-[translate,scale,visibility] duration-200";
const dropdownOpen = "visible translate-y-0 scale-100";
const dropdownShut = "invisible -translate-y-1 scale-95";
const fade = (open: boolean) => `transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`;

const hoverEase = "ease-[cubic-bezier(0.2,0.7,0.2,1)]";

/* ------------------------------------------------------------------------------------------ */
/* A · One capsule                                                                            */
/* ------------------------------------------------------------------------------------------ */

/** Moves the indicator under `el` by writing CSS variables on its parent; no React state, no re-render. */
function slideTo(el: HTMLElement | null) {
  const list = el?.parentElement;
  if (!el || !list) return;
  list.style.setProperty("--pill-x", `${el.offsetLeft}px`);
  list.style.setProperty("--pill-w", `${el.offsetWidth}px`);
  list.style.setProperty("--pill-o", "1");
}

function Capsule({ items, current, onSelect, homeLabel, onImage }: Concept) {
  const { ref, open, setOpen } = useMenu();
  const link = "relative z-10 flex h-10 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap";
  return (
    <header ref={ref} className="absolute inset-x-0 top-0 z-30 px-3 pt-3 @2xl:pt-5">
      <div className="relative mx-auto w-full @2xl:w-fit">
        <GlassPanel onImage={onImage} radius={28} className="flex items-center justify-between py-1.5 pr-1.5 pl-5 @2xl:gap-8">
          <Logo label={homeLabel} className="h-7" />
          <nav
            aria-label="Primary"
            className="relative hidden @2xl:flex"
            onPointerLeave={(event) =>
              slideTo(event.currentTarget.querySelector<HTMLElement>('[aria-current="page"]'))
            }
          >
            <span
              aria-hidden
              className={`absolute top-0 left-0 h-full rounded-full bg-fg/12 shadow-[inset_0_0_0_1px_var(--glass-bevel-strong)] transition-[translate,width,opacity] duration-300 ${hoverEase}`}
              style={{ width: "var(--pill-w, 0px)", translate: "var(--pill-x, 0px) 0", opacity: "var(--pill-o, 0)" }}
            />
            {items.map((item) => (
              <a
                key={item.href}
                href="#"
                aria-current={item.href === current ? "page" : undefined}
                ref={(el) => {
                  // Settle the indicator on the current page after every render.
                  if (el && item.href === current) slideTo(el);
                }}
                onPointerEnter={(event) => slideTo(event.currentTarget)}
                onFocus={(event) => slideTo(event.currentTarget)}
                onBlur={(event) =>
                  slideTo(event.currentTarget.parentElement?.querySelector<HTMLElement>('[aria-current="page"]') ?? null)
                }
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(item.href);
                }}
                className={`${link} aria-[current=page]:font-semibold`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="capsule-menu"
            onClick={() => setOpen(!open)}
            className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-fg/10 @2xl:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </GlassPanel>
        <div
          id="capsule-menu"
          inert={!open}
          className={`${dropdown} absolute inset-x-0 top-full origin-top pt-2 @2xl:hidden ${open ? dropdownOpen : dropdownShut}`}
        >
          <GlassPanel onImage={onImage} radius={24} className="p-2">
            <div className={`flex flex-col ${fade(open)}`}>
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  current={current}
                  onSelect={(href) => {
                    onSelect(href);
                    setOpen(false);
                  }}
                  className="flex h-11 items-center rounded-2xl px-4 text-base font-medium aria-[current=page]:bg-fg/12 aria-[current=page]:font-semibold"
                />
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Shared full-screen menu (B and E on phones)                                                */
/* ------------------------------------------------------------------------------------------ */

function Overlay({
  open,
  onClose,
  items,
  current,
  onSelect,
  homeLabel,
}: Pick<Concept, "items" | "current" | "onSelect" | "homeLabel"> & { open: boolean; onClose: () => void }) {
  return (
    <div
      inert={!open}
      className={`absolute inset-0 z-40 flex flex-col bg-bg/80 backdrop-blur-2xl transition-opacity duration-300 @2xl:hidden ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <Logo label={homeLabel} className="h-9" />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-full hover:bg-fg/10"
        >
          <MenuIcon open />
        </button>
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col justify-center gap-1 px-5 pb-20">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            current={current}
            onSelect={(href) => {
              onSelect(href);
              onClose();
            }}
            className="font-display py-1.5 text-5xl tracking-tight text-fg/55 hover:text-fg aria-[current=page]:text-fg"
          />
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* B · Type only                                                                              */
/* ------------------------------------------------------------------------------------------ */

function TypeOnly({ items, current, onSelect, homeLabel, onImage }: Concept) {
  const { open, setOpen } = useMenu();
  const shadow = onImage ? "[text-shadow:0_1px_8px_rgb(0_0_0/0.35)]" : "";
  return (
    <>
      {onImage && <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black/45 to-transparent" />}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 @2xl:px-8 @2xl:py-7">
        <Logo label={homeLabel} className="h-9" />
        <nav aria-label="Primary" className="hidden gap-8 @2xl:flex">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              current={current}
              onSelect={onSelect}
              className={`relative py-1 text-[0.9375rem] font-medium tracking-[-0.005em] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 ${shadow}`}
            />
          ))}
        </nav>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-full @2xl:hidden"
        >
          <MenuIcon className={onImage ? "drop-shadow-[0_1px_4px_rgb(0_0_0/0.4)]" : ""} />
        </button>
      </header>
      <Overlay open={open} onClose={() => setOpen(false)} items={items} current={current} onSelect={onSelect} homeLabel={homeLabel} />
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* C · Logo as the menu                                                                       */
/* ------------------------------------------------------------------------------------------ */

function LogoMenu({ items, current, onSelect, homeLabel, onImage }: Concept) {
  const { ref, open, setOpen } = useMenu();
  return (
    <div
      ref={ref}
      className="absolute top-4 left-4 z-30 @2xl:top-6 @2xl:left-6"
      // A mouse opens it on hover; touch and keyboard use the button.
      onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setOpen(false)}
    >
      <GlassPillButton
        size="md"
        onImage={onImage}
        aria-label={homeLabel}
        aria-expanded={open}
        aria-controls="logo-menu"
        onClick={() => setOpen(!open)}
        className="h-12! w-12! px-0!"
      >
        <LogoMask className="h-5" />
      </GlassPillButton>
      <div
        id="logo-menu"
        inert={!open}
        className={`${dropdown} absolute top-full left-0 origin-top-left pt-2 ${open ? dropdownOpen : dropdownShut}`}
      >
        <GlassPanel onImage={onImage} radius={24} className="w-56 p-2">
          <div className={`flex flex-col ${fade(open)}`}>
          <NavLink
            item={{ href: "", label: homeLabel }}
            current={current}
            onSelect={(href) => {
              onSelect(href);
              setOpen(false);
            }}
            className="flex h-10 items-center rounded-xl px-4 text-sm text-fg/60 hover:bg-fg/10 hover:text-fg"
          >
            Home
          </NavLink>
          <div className="mx-4 my-1 h-px bg-fg/15" />
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              current={current}
              onSelect={(href) => {
                onSelect(href);
                setOpen(false);
              }}
              className="flex h-11 items-center rounded-xl px-4 text-[0.9375rem] font-medium hover:bg-fg/10 aria-[current=page]:bg-fg/12 aria-[current=page]:font-semibold"
            />
          ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* D · Floating dock                                                                          */
/* ------------------------------------------------------------------------------------------ */

/** True while the user scrolls down past the top, false as soon as they scroll back up. */
function useHiddenOnScrollDown(scroller: RefObject<HTMLDivElement | null>) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let last = el.scrollTop;
    const onScroll = () => {
      const y = el.scrollTop;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 80);
      last = y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scroller]);
  return hidden;
}

function Dock({ items, current, onSelect, homeLabel, onImage, scroller }: Concept) {
  const hidden = useHiddenOnScrollDown(scroller);
  return (
    <>
      {onImage && <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black/45 to-transparent" />}
      <div className="absolute top-5 left-5 z-30 @2xl:top-7 @2xl:left-8">
        <Logo label={homeLabel} className="h-9" />
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 transition-transform duration-500 focus-within:translate-y-0 @2xl:p-5 ${hoverEase} ${
          hidden ? "translate-y-[calc(100%+0.5rem)]" : "translate-y-0"
        }`}
      >
        <GlassPanel onImage={onImage} radius={28} className="pointer-events-auto p-1.5">
          <nav aria-label="Primary" className="flex gap-0.5 @2xl:gap-1">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                current={current}
                onSelect={onSelect}
                className="flex h-10 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap hover:bg-fg/10 aria-[current=page]:bg-fg/12 aria-[current=page]:font-semibold aria-[current=page]:shadow-[inset_0_0_0_1px_var(--glass-bevel-strong)] @2xl:px-4 @2xl:text-sm"
              />
            ))}
          </nav>
        </GlassPanel>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* E · Side rail                                                                              */
/* ------------------------------------------------------------------------------------------ */

function Rail({ items, current, onSelect, homeLabel, onImage }: Concept) {
  const { open, setOpen } = useMenu();
  return (
    <>
      <aside
        className={`absolute inset-y-0 left-0 z-30 hidden w-16 flex-col items-center gap-12 border-r border-line py-7 @2xl:flex ${
          onImage ? "bg-gradient-to-r from-black/35 to-transparent" : ""
        }`}
      >
        <Logo label={homeLabel} className="h-8" />
        <nav aria-label="Primary" className="flex flex-col items-center gap-7">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              current={current}
              onSelect={onSelect}
              className="relative rotate-180 text-sm font-medium tracking-wide text-fg/60 [writing-mode:vertical-rl] hover:text-fg aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-y-0 aria-[current=page]:after:-left-2.5 aria-[current=page]:after:w-px aria-[current=page]:after:bg-current"
            />
          ))}
        </nav>
      </aside>
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 @2xl:hidden">
        <Logo label={homeLabel} className="h-9" />
        <GlassPillButton
          size="sm"
          onImage={onImage}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="size-10! px-0!"
        >
          <MenuIcon />
        </GlassPillButton>
      </header>
      <Overlay open={open} onClose={() => setOpen(false)} items={items} current={current} onSelect={onSelect} homeLabel={homeLabel} />
    </>
  );
}
