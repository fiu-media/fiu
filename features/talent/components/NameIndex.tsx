"use client";

import { LazyMotion, m, useSpring } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";

import { SizedImg } from "@/components/ui/SizedImg";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { SizedImage } from "@/sanity/lib/image";

export type IndexItem = {
  title: string;
  /** Shown at the right of the row (a talent's roles, a project's type and year). */
  meta: string;
  href: string;
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
    <ul
      ref={box}
      aria-label={label}
      className="relative divide-y divide-line border-y border-line"
      onPointerLeave={() => setActive(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
      }}
    >
      {items.map((item, i) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex items-center gap-4 py-5 transition-opacity duration-300 motion-reduce:transition-none md:py-6"
            style={{ opacity: active === null || active === i ? 1 : 0.35 }}
            onPointerEnter={(event) => {
              setActive(i);
              place(event.clientX, event.clientY, active === null);
            }}
            onPointerMove={(event) => place(event.clientX, event.clientY)}
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
                className="hidden size-12 shrink-0 rounded-lg max-md:block pointer-coarse:block"
              />
            )}
            {/* `truncate` clips overflow, and the display italic's descenders (g, y) hang below a one-em line box.
              The padding gives them room inside the clip; the negative margin keeps the row height as it was. */}
            <span className="-my-[0.15em] min-w-0 flex-1 truncate py-[0.15em] font-display text-3xl italic md:text-6xl">
              {item.title}
            </span>
            <span className="shrink-0 text-right text-xs text-fg-muted md:text-sm">{item.meta}</span>
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
              <SizedImg
                key={item.href}
                image={item.image}
                alt=""
                fill
                sizes={`${previewWidth}px`}
                className="transition-opacity duration-200 motion-reduce:transition-none"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ) : null,
          )}
        </m.li>
      </LazyMotion>
    </ul>
  );
}
