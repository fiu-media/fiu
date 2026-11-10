"use client";

import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GlassPanel, GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { useQuoteBasket } from "@/features/rentals/basket/store";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import { href, routes } from "@/lib/routes";

import { QuoteLines } from "./QuoteLines";

/** Floating quote basket: a pill that opens a glass drawer, which swipes away to the right (Base UI's Drawer). */
export function QuoteDrawer({ lang, dict }: { lang: Locale; dict: Dictionary["basket"] }) {
  const [open, setOpen] = useState(false);
  const { count } = useQuoteBasket();
  const pathname = usePathname();
  const quoteHref = href(lang, routes.quote());

  // The review page shows the same basket in full, and an empty basket needs no shortcut.
  if (count === 0 || pathname === quoteHref) return null;

  const close = () => setOpen(false);

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      <div className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Drawer.Trigger aria-label={format(dict.openWithCount, { count }, lang)} render={<GlassPillButton size="lg" />}>
          <span>{dict.title}</span>
          <span
            aria-hidden
            className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent"
          >
            {count}
          </span>
        </Drawer.Trigger>
      </div>

      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-scrim opacity-[calc(0.4*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="pointer-events-none fixed inset-0 z-50 flex justify-end">
          {/* Moved with transform only: an ancestor with opacity below 1 would become the panel's backdrop root, and
              its blur and lens would have nothing behind them to bend. */}
          <Drawer.Popup className="pointer-events-auto h-dvh w-[min(26rem,100vw)] [transform:translateX(var(--drawer-swipe-movement-x))] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-3 text-fg transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateX(100%)] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none motion-reduce:transition-none">
            <GlassPanel className="flex h-full flex-col p-5">
              <div className="mb-2 flex items-center justify-between">
                <Drawer.Title className="font-display text-2xl">{dict.title}</Drawer.Title>
                <Drawer.Close
                  aria-label={dict.close}
                  className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-line"
                >
                  <X aria-hidden className="size-5" />
                </Drawer.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <QuoteLines dict={dict} onNavigate={close} />
              </div>
              <GlassPillLink href={quoteHref} onClick={close} size="lg" className="mt-4 w-full">
                {dict.review}
              </GlassPillLink>
            </GlassPanel>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
