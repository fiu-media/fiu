"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useRef } from "react";
import { useLiquidGlass } from "@/components/ui/useLiquidGlass";

export type NavItem = { href: string; label: string };

type NavProps = {
  items: NavItem[];
  /** Accessible name for the landmark (localised). */
  label: string;
  onImage?: boolean;
  className?: string;
};

/**
 * Primary navigation: one clear acrylic pill per link, like the logo's own material. The
 * current page is lit (brighter bevel, small dot); hover lifts the pill toward the pointer.
 */
export function GlassNav({
  current,
  ...props
}: NavProps & {
  /** Override the active item (defaults to matching the current pathname). */
  current?: string;
}) {
  if (current !== undefined) return <NavList {...props} pathname={current} />;
  return (
    <Suspense fallback={<NavList {...props} pathname="" />}>
      <RouteNavList {...props} />
    </Suspense>
  );
}

function RouteNavList(props: NavProps) {
  return <NavList {...props} pathname={usePathname()} />;
}

function NavList({ items, label, onImage, className, pathname }: NavProps & { pathname: string }) {
  return (
    <nav
      aria-label={label}
      className={["flex flex-wrap items-center justify-center gap-1.5 md:gap-2", onImage && "glass-on-image", className]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <NavPiece
          key={item.href}
          item={item}
          current={pathname === item.href || pathname.startsWith(`${item.href}/`)}
        />
      ))}
    </nav>
  );
}

function NavPiece({ item, current }: { item: NavItem; current: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const glass = useLiquidGlass(ref, { bezel: 9, strength: 24 });
  return (
    <Link
      href={item.href}
      ref={ref}
      style={glass.style}
      aria-current={current ? "page" : undefined}
      onPointerMove={glass.onPointerMove}
      onPointerLeave={glass.onPointerLeave}
      className="glass glass-piece glass-interactive inline-flex h-9 items-center justify-center rounded-full px-2.5 text-[0.75rem] font-medium tracking-[-0.005em] whitespace-nowrap sm:h-10 sm:px-4 sm:text-sm md:h-11 md:px-5 md:text-[0.9375rem]"
    >
      {glass.filter}
      {item.label}
    </Link>
  );
}
