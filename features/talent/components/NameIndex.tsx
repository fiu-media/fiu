"use client";

import { LazyMotion, m, useSpring } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Cut, cutName } from "@/components/ui/Cut";
import { SizedImg } from "@/components/ui/SizedImg";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { SizedImage } from "@/sanity/lib/image";

export type IndexItem = {
  title: string;
  /** Shown at the right of the row (a talent's roles, a project's type and year). */
  meta: string;
  href: string;
  /** A person's slug: with it, the name and the preview carry into the heading and portrait on their page. */
  slug?: string | undefined;
  /** Optional: a row without an image still lists and links. */
  image?: SizedImage | null;
};

const loadMotionFeatures = () => import("./motion-features").then((module) => module.default);

/** Soft enough to read as a glide, stiff enough that the preview never trails far behind the cursor. */
const FOLLOW = { stiffness: 350, damping: 35 };

/**
 * Big-type index list. On a fine pointer the row's image follows the cursor on a spring; the same preview
 * appears beside a row on keyboard focus. Without a pointer to hover with, each row carries a
 * small thumbnail instead, so nothing depends on hover: every row is a plain link with its
 * meta text always visible.
 */
export function NameIndex({
  label,
  items,
  ratio,
  previewWidth,
}: {
  label: string;
  items: IndexItem[];
  ratio: string;
  previewWidth: number;
}) {
  const box = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();
  // Where the preview shows (the same break as its `md:pointer-fine:block`).
  const previewing = useMediaQuery("(min-width: 48rem) and (pointer: fine)", false);
  // Next keeps a page you leave alive, hidden, and shows it again on Back with its state; it comes back unhovered.
  useEffect(() => () => setActive(null), []);
  // The row last opened. Coming back, its name and portrait return to it: the portrait shrinks into the (hidden) preview.
  const [opened, setOpened] = useState<number | null>(null);
  const carried = active ?? opened;
  const x = useSpring(0, FOLLOW);
  const y = useSpring(0, FOLLOW);

  /** `snap` jumps there instead of gliding: used when the preview is hidden, so it never flies in from its last spot. */
  function place(clientX: number, clientY: number, snap = false) {
    const el = box.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const move = snap || reduced ? "jump" : "set";
    x[move](clientX - rect.left);
    y[move](clientY - rect.top);
  }

  return (
    // The pointer leaving the list clears the highlight; so does focus leaving it, which each link checks as it blurs.
    <ul
      ref={box}
      aria-label={label}
      className="relative divide-y divide-line border-y border-line"
      onPointerLeave={() => setActive(null)}
    >
      {items.map((item, i) => (
        <li key={item.href}>
          <Link
            href={item.href}
            // Loads the whole page ahead of the click, so the name and portrait can carry straight into it.
            prefetch
            className="group flex items-center gap-4 py-5 transition-opacity duration-300 motion-reduce:transition-none md:py-6"
            // 0.6 keeps the other names at 6.4:1 on Ink (AA); a lower value drops them under 3:1.
            style={{ opacity: active === null || active === i ? 1 : 0.6 }}
            onPointerEnter={(event) => {
              setActive(i);
              place(event.clientX, event.clientY, active === null);
            }}
            onPointerMove={(event) => place(event.clientX, event.clientY)}
            onClick={() => setOpened(i)}
            onBlur={(event) => {
              if (!box.current?.contains(event.relatedTarget)) setActive(null);
            }}
            onFocus={(event) => {
              const wasHidden = active === null;
              setActive(i);
              // A mouse click focuses the link too, but the preview should stay under the cursor then.
              if (!event.currentTarget.matches(":focus-visible")) return;
              const row = event.currentTarget.getBoundingClientRect();
              place(row.right - previewWidth, row.top + row.height / 2, wasHidden);
            }}
          >
            {item.image && (
              <SizedImg
                image={item.image}
                alt=""
                sizes="48px"
                className="hidden size-12 shrink-0 rounded-xl max-md:block pointer-coarse:block"
              />
            )}
            {/* `truncate` clips overflow, and the display italic's descenders (g, y) hang below a one-em line box.
              The padding gives them room inside the clip; the negative margin keeps the row height as it was. */}
            {/* On phones the meta stacks under the name so a long roles list can't squeeze the name; from `md` the
              wrapper drops out (`contents`) and name and meta are the row's flex items again. */}
            <div className="min-w-0 flex-1 md:contents">
              <span className="-my-[0.15em] block min-w-0 truncate py-[0.15em] font-display text-3xl italic md:flex-1 md:text-6xl">
                {/* Inline, so the shared box is the name's own width rather than the whole row. */}
                {/* Only alongside its portrait: a name travelling alone would cross the portrait as it fades. */}
                <Cut name={previewing && i === carried && item.image ? cutName.name(item.slug) : null} text>
                  <span>{item.title}</span>
                </Cut>
              </span>
              <span className="block text-xs text-fg-muted md:shrink-0 md:text-right md:text-sm">{item.meta}</span>
            </div>
          </Link>
        </li>
      ))}

      {/* Centred on the cursor and nudged right so it never hides the pointer. Motion drives `transform` with the
          spring; the nudge and the centring use the separate `margin` and `translate`, which compose with it. */}
      <LazyMotion features={loadMotionFeatures}>
        <m.li
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 ml-6 hidden -translate-y-1/2 overflow-hidden rounded-xl border-0 transition-opacity duration-200 motion-reduce:transition-none md:pointer-fine:block"
          style={{ x, y, width: previewWidth, aspectRatio: ratio, opacity: active === null ? 0 : 1 }}
        >
          {items.map((item, i) =>
            item.image ? (
              // Only one preview is shared: the one under the cursor grows into the portrait, and coming back the
              // portrait shrinks into the opened row's, fading as it goes because that preview is hidden.
              <Cut key={item.href} name={previewing && i === carried ? cutName.portrait(item.slug) : null} fade>
                <SizedImg
                  image={item.image}
                  alt=""
                  fill
                  sizes={`${previewWidth}px`}
                  className="transition-opacity duration-200 motion-reduce:transition-none"
                  style={{ opacity: i === active ? 1 : 0 }}
                />
              </Cut>
            ) : null,
          )}
        </m.li>
      </LazyMotion>
    </ul>
  );
}
