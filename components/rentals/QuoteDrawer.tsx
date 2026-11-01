"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { GlassPanel, GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useQuoteBasket } from "@/lib/quote-basket";
import { QuoteLines } from "./QuoteLines";

/** Floating quote basket: a pill that opens a glass drawer (a native modal dialog, so focus and Esc just work). */
export function QuoteDrawer({ lang, dict }: { lang: Locale; dict: Dictionary["basket"] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { count } = useQuoteBasket();
  const pathname = usePathname();
  const quoteHref = localizedPath(lang, "/rentals/quote");

  // The review page shows the same basket in full, and an empty basket needs no shortcut.
  if (count === 0 || pathname === quoteHref) return null;

  const close = () => dialog.current?.close();

  return (
    <>
      <div className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]">
        <GlassPillButton
          size="lg"
          onClick={() => dialog.current?.showModal()}
          aria-label={format(dict.openWithCount, { count }, lang)}
          aria-haspopup="dialog"
        >
          <span>{dict.title}</span>
          <span
            aria-hidden
            className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-white"
          >
            {count}
          </span>
        </GlassPillButton>
      </div>

      <dialog
        ref={dialog}
        aria-label={dict.title}
        onClick={(event) => event.target === event.currentTarget && close()}
        className="m-0 ml-auto h-dvh max-h-none w-[min(26rem,100vw)] max-w-none bg-transparent pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-3 text-fg backdrop:bg-black/40"
      >
        <GlassPanel className="flex h-full flex-col p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-2xl">{dict.title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={dict.close}
              className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-line"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <QuoteLines dict={dict} onNavigate={close} />
          </div>
          <GlassPillLink href={quoteHref} onClick={close} size="lg" className="mt-4 w-full">
            {dict.review}
          </GlassPillLink>
        </GlassPanel>
      </dialog>
    </>
  );
}
