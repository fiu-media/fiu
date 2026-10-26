"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLiquidGlass } from "@/components/ui/useLiquidGlass";

export type NavItem = { href: string; label: string };

type Indicator = { left: number; width: number; visible: boolean };

/**
 * Primary navigation: one liquid-glass capsule holding every link, with a lighter
 * "lens" that springs to whichever item is hovered or focused and rests on the
 * current page.
 */
export function GlassNav({
  items,
  onImage,
  className,
  current,
}: {
  items: NavItem[];
  onImage?: boolean;
  className?: string;
  /** Override the active item (defaults to matching the current pathname). */
  current?: string;
}) {
  const routePath = usePathname();
  const pathname = current ?? routePath;
  const navRef = useRef<HTMLElement>(null);
  const glass = useLiquidGlass(navRef, { radius: "pill", bezel: 18, strength: 40 });
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, width: 0, visible: false });

  const currentIndex = items.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const moveTo = useCallback((index: number) => {
    const el = linkRefs.current[index];
    if (!el) return setIndicator((prev) => ({ ...prev, visible: false }));
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
  }, []);

  useLayoutEffect(() => {
    moveTo(currentIndex);
  }, [currentIndex, moveTo]);

  return (
    <nav
      aria-label="Primary"
      ref={navRef}
      style={glass.style}
      onPointerMove={glass.onPointerMove}
      onPointerLeave={() => moveTo(currentIndex)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) moveTo(currentIndex);
      }}
      className={[
        "glass glass-nav relative flex items-center rounded-full p-1",
        onImage && "glass-on-image",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {glass.filter}
      <span
        aria-hidden
        className="glass-nav-indicator"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
      {items.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          ref={(el) => {
            linkRefs.current[index] = el;
          }}
          aria-current={index === currentIndex ? "page" : undefined}
          onPointerEnter={() => moveTo(index)}
          onFocus={() => moveTo(index)}
          className="relative z-10 inline-flex h-8 items-center rounded-full px-3 text-[0.8125rem] font-semibold tracking-[-0.01em] whitespace-nowrap outline-offset-0 md:h-9 md:px-4 md:text-sm"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
