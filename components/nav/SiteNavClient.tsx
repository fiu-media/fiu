"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useId, useRef } from "react";
import { GlassPillButton } from "@/components/ui/Glass";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { NavItem } from "@/lib/i18n/nav";
import { HomeLink } from "./HomeLink";

type NavProps = {
  items: NavItem[];
  homeHref: string;
  labels: Dictionary["nav"];
  onImage?: boolean;
  hideLogo?: boolean;
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

function Nav({ items, homeHref, labels, onImage, hideLogo, pathname }: NavProps & { pathname: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const close = () => dialog.current?.close();

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
        className={`fixed inset-y-0 left-0 z-30 hidden w-[calc(4rem+env(safe-area-inset-left))] flex-col items-center gap-12 border-r border-line pt-[max(1.75rem,env(safe-area-inset-top))] pb-7 pl-[env(safe-area-inset-left)] md:flex ${
          onImage ? "bg-gradient-to-r from-black/35 to-transparent [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]" : ""
        }`}
      >
        {/* Sprocket rhythm: a faint, evenly spaced row of ticks, the only nod to film. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-[repeating-linear-gradient(to_bottom,currentColor_0_6px,transparent_6px_18px)] text-fg opacity-10"
        />
        {!hideLogo && <HomeLink href={homeHref} label={labels.home} className="h-7" />}
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
        className={`z-30 flex items-center px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-4 md:hidden ${
          hideLogo ? "justify-end" : "justify-between"
        } ${onImage ? "absolute inset-x-0 top-0" : "relative"}`}
      >
        {!hideLogo && <HomeLink href={homeHref} label={labels.home} className="h-9" />}
        <GlassPillButton
          size="sm"
          onImage={onImage}
          aria-label={labels.menu}
          aria-haspopup="dialog"
          aria-controls={dialogId}
          onClick={() => dialog.current?.showModal()}
          className="size-10! px-0!"
        >
          <MenuIcon />
        </GlassPillButton>
      </header>

      {/* A native modal dialog: focus is trapped, Esc closes, and focus returns to the Menu button. */}
      <dialog
        ref={dialog}
        id={dialogId}
        aria-label={labels.label}
        className="m-0 h-dvh max-h-none w-full max-w-none flex-col bg-bg/80 text-fg backdrop-blur-2xl transition-opacity duration-300 backdrop:bg-transparent starting:open:opacity-0 open:flex md:hidden!"
      >
        <div className="flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))]">
          {hideLogo ? <span /> : <HomeLink href={homeHref} label={labels.home} className="h-9" />}
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
          className="flex flex-1 flex-col justify-center gap-1 px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(5rem,env(safe-area-inset-bottom))]"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="font-display py-1.5 text-5xl tracking-tight text-fg/55 hover:text-fg aria-[current=page]:text-fg"
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
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="size-6">
      <line x1="5" x2="19" y1="8" y2="8" className={`${line} ${open ? "translate-y-[4px] rotate-45" : ""}`} />
      <line x1="5" x2="19" y1="16" y2="16" className={`${line} ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
    </svg>
  );
}
