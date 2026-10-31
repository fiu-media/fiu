"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type IndexItem = {
  title: string;
  /** Shown at the right of the row (a talent's roles, a project's type and year). */
  meta: string;
  href: string;
  /** Optional: a row without an image still lists and links. */
  image?: { src: string; width: number; height: number; blurDataURL?: string; position?: string } | null;
};

/**
 * Big-type index list. On a fine pointer the row's image follows the cursor; the same preview
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

  function place(x: number, y: number) {
    const el = box.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${x - rect.left}px`);
    el.style.setProperty("--y", `${y - rect.top}px`);
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
              place(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => place(event.clientX, event.clientY)}
            onFocus={(event) => {
              setActive(i);
              // A mouse click focuses the link too, but the preview should stay under the cursor then.
              if (!event.currentTarget.matches(":focus-visible")) return;
              const row = event.currentTarget.getBoundingClientRect();
              place(row.right - previewWidth, row.top + row.height / 2);
            }}
          >
            {item.image && (
              <Image
                src={item.image.src}
                width={item.image.width}
                height={item.image.height}
                alt=""
                sizes="48px"
                placeholder={item.image.blurDataURL ? "blur" : "empty"}
                blurDataURL={item.image.blurDataURL}
                style={{ objectPosition: item.image.position }}
                className="hidden size-12 shrink-0 rounded-lg object-cover max-md:block pointer-coarse:block"
              />
            )}
            <span className="font-display min-w-0 flex-1 truncate text-3xl italic md:text-6xl">{item.title}</span>
            <span className="shrink-0 text-right text-xs text-fg-muted md:text-sm">{item.meta}</span>
          </Link>
        </li>
      ))}

      <li
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 hidden overflow-hidden rounded-xl border-0 transition-opacity duration-200 motion-reduce:transition-none md:pointer-fine:block"
        style={{
          width: previewWidth,
          aspectRatio: ratio,
          opacity: active === null ? 0 : 1,
          // The preview is centred on the cursor, nudged right so it never hides the pointer.
          transform: `translate(calc(var(--x, 0px) + 24px), calc(var(--y, 0px) - 50%))`,
        }}
      >
        {items.map((item, i) =>
          item.image ? (
            <Image
              key={item.href}
              src={item.image.src}
              alt=""
              fill
              sizes={`${previewWidth}px`}
              placeholder={item.image.blurDataURL ? "blur" : "empty"}
              blurDataURL={item.image.blurDataURL}
              className="object-cover transition-opacity duration-200 motion-reduce:transition-none"
              style={{ opacity: i === active ? 1 : 0, objectPosition: item.image.position }}
            />
          ) : null,
        )}
      </li>
    </ul>
  );
}
