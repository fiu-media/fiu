"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { EdgeBars } from "@/components/ui/EdgeBars";
import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { NavItem } from "@/lib/i18n/nav";
import { HomeLink } from "./HomeLink";

type NavProps = {
  items: NavItem[];
  homeHref: string;
  labels: Dictionary["nav"];
  onImage?: boolean;
};

export function SiteNavClient(props: NavProps) {
  return (
    <Suspense fallback={<Nav {...props} pathname="" />}>
      <RouteNav {...props} />
    </Suspense>
  );
}

function RouteNav(props: NavProps) {
  return <Nav {...props} pathname={usePathname()} />;
}

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function Nav({ items, homeHref, labels, onImage, pathname }: NavProps & { pathname: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogId = useId();
  const close = () => dialog.current?.close();
  // showModal() focuses the first focusable child, the Home link, which then shows a focus ring. Focus the dialog itself.
  const open = () => {
    setMenuOpen(true);
    dialog.current?.showModal();
    dialog.current?.focus();
  };

  // Navigating, or growing to the rail layout, leaves the overlay behind.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 48rem)");
    const onChange = () => wide.matches && dialog.current?.close();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[calc(4rem+env(safe-area-inset-left))] flex-col items-center gap-12 border-r border-line pt-[max(1.75rem,env(safe-area-inset-top))] pb-7 pl-[env(safe-area-inset-left)] md:flex",
          onImage && "bg-gradient-to-r from-black/35 to-transparent [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]",
        )}
      >
        {/* Sprocket rhythm: a faint, evenly spaced row of ticks, the only nod to film. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-[repeating-linear-gradient(to_bottom,currentColor_0_6px,transparent_6px_18px)] text-fg opacity-10"
        />
        <HomeLink href={homeHref} label={labels.home} className="h-7" />
        <nav aria-label={labels.label} className="flex flex-col items-center gap-7">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="relative rotate-180 rounded-sm text-sm font-medium tracking-wide text-fg/60 [writing-mode:vertical-rl] hover:text-fg aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-y-0 aria-[current=page]:after:-left-2.5 aria-[current=page]:after:w-px aria-[current=page]:after:bg-current"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* On cinematic pages the bar floats over the content; on adaptive pages it takes its own row. */}
      <header
        className={cn(
          "z-30 flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-4 md:hidden",
          onImage ? "absolute inset-x-0 top-0" : "relative",
        )}
      >
        <HomeLink href={homeHref} label={labels.home} className="h-9" />
        <GlassPillButton
          size="sm"
          onImage={onImage}
          aria-label={labels.menu}
          aria-haspopup="dialog"
          aria-controls={dialogId}
          onClick={open}
          className="size-10 px-0"
        >
          <MenuIcon />
        </GlassPillButton>
      </header>

      {/* Safari tints its bars from fixed elements in the page, not from the dialog (it lives in the top layer). These sit
          under the dialog while it is open, so the notch and chin take the surface colour instead of falling back to black. */}
      {menuOpen && <EdgeBars />}

      {/* A native modal dialog: focus is trapped, Esc closes, and focus returns to the Menu button. */}
      <dialog
        ref={dialog}
        id={dialogId}
        aria-label={labels.label}
        tabIndex={-1}
        data-nav-overlay
        onClose={() => setMenuOpen(false)}
        className="fixed inset-0 isolate m-0 h-auto max-h-none w-auto max-w-none touch-none flex-col overflow-visible overscroll-none text-fg outline-none! backdrop:bg-transparent open:flex md:hidden!"
      >
        {/* The frosted background reaches 12rem past the screen edges, so it also fills the notch and chin (and gives
            Safari a layer at the edges to tint its bars from) instead of stopping at the viewport. It appears at once:
            Safari waits for a fading layer to settle before tinting its bars from it, so only the content fades in. The
            tint is a gradient image, not a background colour: Safari takes a fixed layer's flat background colour for its
            bars (solid black here) and ignores the blur, but otherwise shows what is rendered behind it. */}
        <div aria-hidden className="absolute inset-x-0 -inset-y-48 -z-10 bg-linear-to-b from-bg/80 to-bg/80 backdrop-blur-2xl" />
        <div className="flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] transition-opacity duration-300 starting:opacity-0">
          <HomeLink href={homeHref} label={labels.home} className="h-9" />
          <button
            type="button"
            aria-label={labels.closeMenu}
            onClick={close}
            className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-full hover:bg-fg/10"
          >
            <MenuIcon open />
          </button>
        </div>
        <nav
          aria-label={labels.label}
          className="flex flex-1 flex-col justify-center gap-1 px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(5rem,env(safe-area-inset-bottom))] transition-opacity duration-300 starting:opacity-0"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="py-1.5 font-display text-5xl tracking-tight text-fg/55 hover:text-fg aria-[current=page]:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </dialog>
    </>
  );
}

/** Two quiet lines that fold into a cross while the menu is open. */
function MenuIcon({ open = false }: { open?: boolean }) {
  const line = "origin-center [transform-box:fill-box] transition-transform duration-300";
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className="size-6"
    >
      <line x1="5" x2="19" y1="8" y2="8" className={cn(line, open && "translate-y-[4px] rotate-45")} />
      <line x1="5" x2="19" y1="16" y2="16" className={cn(line, open && "-translate-y-[4px] -rotate-45")} />
    </svg>
  );
}
