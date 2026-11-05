import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A pulsing placeholder block. Decorative: wrap a group in <SkeletonGroup> to announce loading once. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("rounded-xl bg-skeleton motion-safe:animate-pulse", className)} />;
}

/** A screen-filling placeholder, for pages whose first screen is one big image (About, Our Work). */
export function FullScreenSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="h-dvh">
      <Skeleton className="size-full rounded-none" />
    </SkeletonGroup>
  );
}

/** Marks a region as loading for assistive tech; the blocks inside stay silent. */
export function SkeletonGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
