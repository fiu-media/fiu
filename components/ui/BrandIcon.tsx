import type { SimpleIcon } from "simple-icons";

import { cn } from "@/lib/cn";

/** A brand mark from Simple Icons (Lucide has none), drawn in the surrounding text colour. */
export function BrandIcon({ icon, className }: { icon: SimpleIcon; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={cn("size-4 shrink-0", className)}>
      <path d={icon.path} />
    </svg>
  );
}
