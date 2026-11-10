"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import { nudgeHomeScrollRepeatedly } from "@/lib/homeScroll";
import { matches, subscribeToMedia } from "@/lib/hooks/useMediaQuery";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { NavItem } from "@/lib/i18n/nav";
import { DESKTOP } from "@/lib/media";
import { railWidth } from "@/lib/rail";

import { HomeLink } from "./HomeLink";
import { LanguageScrollRestore } from "./LanguageScrollRestore";
import { LanguageSwitcher } from "./LanguageSwitcher";

type NavProps = {
  lang: Locale;
  items: NavItem[];
  homeHref: string;
  labels: Dictionary["nav"];
  onImage?: boolean | undefined;
  /** The phone bar floats over footage (Home's hero), so it gets a scrim behind it. */
  overFootage?: boolean | undefined;
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

function Nav({ lang, items, homeHref, labels, onImage, overFootage, pathname }: NavProps & { pathname: string }) {
  // The overlay is open for the page it was opened on, so navigating leaves it behind.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const popup = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  // On Home the photo is what Safari should tint its bars from again once the opaque menu is gone, but it only samples
  // when the page scrolls, so nudge right away.
  const onOpenChange = (next: boolean) => {
    setOpenOn(next ? pathname : null);
    if (!next) nudgeHomeScrollRepeatedly();
  };
  const close = () => onOpenChange(false);

  // Growing to the rail layout leaves it behind too.
  useEffect(() => subscribeToMedia(DESKTOP)(() => matches(DESKTOP) && setOpenOn(null)), []);

  // Home: over the hero the rail carries the footage treatment (`rail-halo`). Below the fold it settles into the normal
  // rail item by item, each one as the photo's bottom edge passes it, and the hairline grows down from that edge, so the
  // change follows the edge the eye is already watching instead of flipping the whole rail at once.
  useEffect(() => {
    const aside = rail.current;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!overFootage || !aside || !hero) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const fold = hero.getBoundingClientRect().bottom;
      aside.style.setProperty("--fold-y", `${Math.min(Math.max(fold, 0), window.innerHeight)}px`);
      for (const link of aside.querySelectorAll("a")) {
        const box = link.getBoundingClientRect();
        link.toggleAttribute("data-settled", box.top + box.height / 2 > fold);
      }
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      aside.style.removeProperty("--fold-y");
      for (const link of aside.querySelectorAll("[data-settled]")) link.removeAttribute("data-settled");
    };
  }, [overFootage]);

  return (
    <>
      <LanguageScrollRestore pathname={pathname} />
      <aside
        ref={rail}
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col items-center gap-8 border-r border-line pt-[max(1.75rem,env(safe-area-inset-top))] pb-7 pl-[env(safe-area-inset-left)] md:flex",
          railWidth,
          // Over Home's hero: a letter halo, and edge light only behind bright stills (`rail-halo` in globals.css).
          overFootage
            ? "rail-halo"
            : onImage && "bg-gradient-to-r from-scrim/35 to-transparent [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]",
        )}
      >
        {/* Sprocket rhythm: a faint, evenly spaced row of ticks, the only nod to film. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-[repeating-linear-gradient(to_bottom,currentColor_0_6px,transparent_6px_18px)] text-fg opacity-10"
        />
        <HomeLink href={homeHref} label={labels.home} className="h-7" />
        <nav aria-label={labels.label} className="flex flex-1 flex-col items-center justify-center gap-7">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="relative rotate-180 rounded-sm text-sm font-medium tracking-wide text-fg-quiet [writing-mode:vertical-rl] hover:text-fg aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-y-0 aria-[current=page]:after:-left-2.5 aria-[current=page]:after:w-px aria-[current=page]:after:bg-current"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rail-lang">
          <LanguageSwitcher variant="rail" lang={lang} pathname={pathname} label={labels.language} />
        </div>
      </aside>

      {/* On cinematic pages the bar floats over the content; on adaptive pages it takes its own row. */}
      <header
        className={cn(
          "z-30 flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-4 md:hidden",
          onImage ? "absolute inset-x-0 top-0" : "relative",
          // Over footage, a soft scrim behind the logo and the Menu button keeps them legible against a bright sky.
          overFootage
            && "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-40 before:bg-gradient-to-b before:from-scrim/50 before:to-transparent",
        )}
      >
        <HomeLink href={homeHref} label={labels.home} className="h-9" />
        {/* Focus is trapped, Esc closes, and focus returns to the Menu button. The root isn't scroll-locked, though: a
            locked root stops WebKit painting past the viewport edge, and Safari then tints its bars from the html
            background (black). The overlay holds the page still with touch-action instead. */}
        <Dialog.Root open={openOn === pathname} onOpenChange={onOpenChange} modal="trap-focus">
          <Dialog.Trigger
            aria-label={labels.menu}
            render={<GlassPillButton size="sm" onImage={onImage} className="size-10 px-0" />}
          >
            <Menu aria-hidden className="size-6" />
          </Dialog.Trigger>
          <Dialog.Portal>
            {/* The background is an opaque colour on the popup itself, not a translucent layer inside it: Safari takes
                the colour for its status bar and toolbar from the element at the screen edge, and a transparent or
                see-through one comes out black. Only the content fades, in and out. Base UI keeps the popup mounted
                only for animations on the popup itself, not its children, so it carries a transition no one can see
                (the outline colour, under outline-none) whose duration matches the content fade. */}
            <Dialog.Popup
              ref={popup}
              aria-label={labels.label}
              // Focusing the first link would put a focus ring on the Home link. Focus the overlay itself.
              initialFocus={popup}
              className="group fixed inset-0 isolate z-50 flex touch-none flex-col overscroll-none bg-bg text-fg transition-[outline-color] duration-300 outline-none data-ending-style:outline-transparent motion-reduce:transition-none md:hidden"
            >
              <div className="flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] transition-opacity duration-300 group-data-ending-style:opacity-0 group-data-starting-style:opacity-0 motion-reduce:transition-none">
                <HomeLink href={homeHref} label={labels.home} className="h-9" />
                <Dialog.Close
                  aria-label={labels.closeMenu}
                  className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-full hover:bg-fg/10"
                >
                  <X aria-hidden className="size-6" />
                </Dialog.Close>
              </div>
              <nav
                aria-label={labels.label}
                className="flex flex-1 flex-col justify-center gap-1 px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(5rem,env(safe-area-inset-bottom))] transition-opacity duration-300 group-data-ending-style:opacity-0 group-data-starting-style:opacity-0 motion-reduce:transition-none"
              >
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                    className="py-1.5 font-display text-5xl tracking-tight text-fg/60 hover:text-fg aria-[current=page]:text-fg"
                  >
                    {item.label}
                  </Link>
                ))}
                <LanguageSwitcher variant="menu" lang={lang} pathname={pathname} label={labels.language} className="mt-10" />
              </nav>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </header>
    </>
  );
}
