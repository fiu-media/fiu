import type { ReactNode } from "react";

/** A pulsing placeholder block. Decorative: wrap a group in <SkeletonGroup> to announce loading once. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-xl bg-line motion-safe:animate-pulse ${className}`} />;
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
