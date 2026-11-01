"use client";

import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useLiquidGlass } from "./useLiquidGlass";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[0.8125rem]",
  md: "h-10 px-5 text-[0.9375rem]",
  lg: "h-12 px-7 text-base",
};

const lens: Record<Size, { bezel: number; strength: number }> = {
  sm: { bezel: 7, strength: 18 },
  md: { bezel: 8, strength: 22 },
  lg: { bezel: 9, strength: 26 },
};

type PillStyle = {
  size?: Size;
  /** Sitting over photography: forces light-on-dark glass regardless of surface. */
  onImage?: boolean;
  className?: string;
  children: ReactNode;
};

function pillClass({ size = "md", onImage, className }: Omit<PillStyle, "children">) {
  return cn(
    "glass glass-piece glass-interactive inline-flex cursor-pointer items-center justify-center gap-2 rounded-full",
    "font-semibold tracking-[-0.01em] whitespace-nowrap select-none disabled:cursor-not-allowed",
    sizes[size],
    onImage && "glass-on-image",
    className,
  );
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
      onPointerLeave={glass.onPointerLeave}
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
      onPointerLeave={glass.onPointerLeave}
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
  const glass = useLiquidGlass(ref, { radius, bezel: 13, strength: 34, aberration: 0.1 });
  return (
    <div
      {...props}
      ref={ref}
      style={{ ...glass.style, borderRadius: radius }}
      onPointerMove={glass.onPointerMove}
      className={cn("glass glass-panel", onImage && "glass-on-image", className)}
    >
      {glass.filter}
      {children}
    </div>
  );
}
