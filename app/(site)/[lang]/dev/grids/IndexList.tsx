"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef, useState } from "react";

export type IndexItem = { title: string; meta: string; still: StaticImageData };

/**
 * Big-type index list. On a fine pointer the row's image follows the cursor; the same preview
 * appears beside a row on keyboard focus. On touch there is no hover, so each row carries a
 * small thumbnail instead.
 */
export function IndexList({ items, ratio, previewWidth }: { items: IndexItem[]; ratio: string; previewWidth: number }) {
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
      className="relative divide-y divide-line border-y border-line"
      onPointerLeave={() => setActive(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
      }}
    >
      {items.map((item, i) => (
        <li key={item.title}>
          <a
            href="#"
            className="group flex items-center gap-4 py-5 transition-opacity duration-300 motion-reduce:transition-none md:py-6"
            style={{ opacity: active === null || active === i ? 1 : 0.35 }}
            onPointerEnter={(event) => {
              setActive(i);
              place(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => place(event.clientX, event.clientY)}
            onFocus={(event) => {
              setActive(i);
              const row = event.currentTarget.getBoundingClientRect();
              place(row.right - previewWidth, row.top + row.height / 2);
            }}
          >
            <Image
              src={item.still}
              alt=""
              width={96}
              height={96}
              sizes="48px"
              className="hidden size-12 max-md:block pointer-coarse:block shrink-0 rounded-lg object-cover"
            />
            <span className="font-display min-w-0 flex-1 truncate text-3xl italic md:text-6xl">{item.title}</span>
            <span className="shrink-0 text-right text-xs text-fg-muted md:text-sm">{item.meta}</span>
          </a>
        </li>
      ))}

      <li
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 hidden border-0 md:pointer-fine:block overflow-hidden rounded-xl transition-opacity duration-200 motion-reduce:transition-none"
        style={{
          width: previewWidth,
          aspectRatio: ratio,
          opacity: active === null ? 0 : 1,
          // The preview is centred on the cursor, nudged right so it never hides the pointer.
          transform: `translate(calc(var(--x, 0px) + 24px), calc(var(--y, 0px) - 50%))`,
        }}
      >
        {items.map((item, i) => (
          <Image
            key={item.title}
            src={item.still}
            alt=""
            fill
            sizes={`${previewWidth}px`}
            className="object-cover transition-opacity duration-200 motion-reduce:transition-none"
            style={{ opacity: i === active ? 1 : 0 }}
          />
        ))}
      </li>
    </ul>
  );
}
