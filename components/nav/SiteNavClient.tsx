"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BriertoWatermark } from "@/components/brierto/BriertoWatermark";
import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { NavItem } from "@/lib/i18n/nav";
import { nudgeHomeScrollRepeatedly } from "@/components/home/bleed";
import { HomeLink } from "./HomeLink";
import { LanguageSwitcher } from "./LanguageSwitcher";

type NavProps = {
  lang: Locale;
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

function Nav({ lang, items, homeHref, labels, onImage, pathname }: NavProps & { pathname: string }) {
  // The overlay is open for the page it was opened on, so navigating leaves it behind.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const popup = useRef<HTMLDivElement>(null);
  // On Home the photo is what Safari should tint its bars from again once the opaque menu is gone, but it only samples
  // when the page scrolls, so nudge right away.
  const onOpenChange = (next: boolean) => {
    setOpenOn(next ? pathname : null);
    if (!next) nudgeHomeScrollRepeatedly();
  };
  const close = () => onOpenChange(false);

  // Growing to the rail layout leaves it behind too.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 48rem)");
    const onChange = () => wide.matches && setOpenOn(null);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <BriertoWatermark />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[calc(4rem+env(safe-area-inset-left))] flex-col items-center gap-8 border-r border-line pt-[max(1.75rem,env(safe-area-inset-top))] pb-7 pl-[env(safe-area-inset-left)] md:flex",
          onImage && "bg-gradient-to-r from-black/35 to-transparent [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]",
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
              className="relative rotate-180 rounded-sm text-sm font-medium tracking-wide text-fg/60 [writing-mode:vertical-rl] hover:text-fg aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-y-0 aria-[current=page]:after:-left-2.5 aria-[current=page]:after:w-px aria-[current=page]:after:bg-current"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher variant="rail" lang={lang} pathname={pathname} label={labels.language} />
      </aside>

      {/* On cinematic pages the bar floats over the content; on adaptive pages it takes its own row. */}
      <header
        className={cn(
          "z-30 flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-4 md:hidden",
          onImage ? "absolute inset-x-0 top-0" : "relative",
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
