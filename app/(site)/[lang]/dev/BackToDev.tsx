"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

// Slim bar above every /dev sub-page so the index is one click away. Hidden on the index itself.
export function BackToDev({ href }: { href: string }) {
  if (useSelectedLayoutSegment() === null) return null;
  return (
    <nav
      aria-label="Dev"
      data-surface="cinematic"
      className="flex h-(--dev-bar) items-center border-b border-line bg-ink px-4 text-fg md:px-6"
    >
      <Link
        href={href}
        className="-mx-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <span aria-hidden>←</span> Dev
      </Link>
    </nav>
  );
}
