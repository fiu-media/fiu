import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** The quiet "back to the list" link at the top of a detail page. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm link-quiet">
      <ArrowLeft aria-hidden className="size-4" />
      {children}
    </Link>
  );
}
