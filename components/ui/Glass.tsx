"use client";

import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { useLiquidGlass } from "./useLiquidGlass";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[0.8125rem]",
  md: "h-10 px-5 text-[0.9375rem]",
  lg: "h-12 px-7 text-base",
};

const lens: Record<Size, { bezel: number; strength: number }> = {
  sm: { bezel: 12, strength: 26 },
  md: { bezel: 15, strength: 32 },
  lg: { bezel: 18, strength: 38 },
};

type PillStyle = {
  size?: Size;
  /** Sitting over photography: forces light-on-dark glass regardless of surface. */
  onImage?: boolean;
  className?: string;
  children: ReactNode;
};

function pillClass({ size = "md", onImage, className }: Omit<PillStyle, "children">) {
  return [
    "glass glass-interactive inline-flex items-center justify-center gap-2 rounded-full",
    "font-semibold tracking-[-0.01em] whitespace-nowrap select-none",
    sizes[size],
    onImage && "glass-on-image",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function GlassPillLink({
  size = "md",
  onImage,
  className,
  children,
  current,
  ...props
}: PillStyle & { current?: boolean } & Omit<ComponentProps<typeof Link>, "className">) {
  const ref = useRef<HTMLAnchorElement>(null);
  const glass = useLiquidGlass(ref, lens[size]);
  return (
    <Link
      {...props}
      ref={ref}
      style={glass.style}
      onPointerMove={glass.onPointerMove}
      aria-current={current ? "page" : undefined}
      className={pillClass({ size, onImage, className })}
    >
      {glass.filter}
      {children}
    </Link>
  );
}

export function GlassPillButton({
  size = "md",
  onImage,
  className,
  children,
  type = "button",
  ...props
}: PillStyle & Omit<ComponentProps<"button">, "className">) {
  const ref = useRef<HTMLButtonElement>(null);
  const glass = useLiquidGlass(ref, lens[size]);
  return (
    <button
      {...props}
      ref={ref}
      style={glass.style}
      onPointerMove={glass.onPointerMove}
      type={type}
      className={pillClass({ size, onImage, className })}
    >
      {glass.filter}
      {children}
    </button>
  );
}

export function GlassPanel({
  onImage,
  className,
  children,
  radius = 28,
  ...props
}: { onImage?: boolean; radius?: number } & ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const glass = useLiquidGlass(ref, { radius, bezel: 30, strength: 56, aberration: 0.06 });
  return (
    <div
      {...props}
      ref={ref}
      style={{ ...glass.style, borderRadius: radius }}
      onPointerMove={glass.onPointerMove}
      className={["glass glass-panel", onImage && "glass-on-image", className].filter(Boolean).join(" ")}
    >
      {glass.filter}
      {children}
    </div>
  );
}
