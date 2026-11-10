import type { ReactNode } from "react";

import { pageGutter } from "@/components/layout/nav/rail";
import { cn } from "@/lib/cn";

/** The page's `<main>`: centred, with the side gutter. `className` changes the width, padding or layout. */
export function PageShell({ className, children }: { className?: string; children: ReactNode }) {
  return <main className={cn("mx-auto max-w-6xl pb-32", pageGutter, className)}>{children}</main>;
}
