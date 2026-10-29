"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { GlassPillLink } from "@/components/ui/Glass";

// Floats over every /dev sub-page so the index is one click away. Hidden on the index itself.
export function BackToDev({ href }: { href: string }) {
  if (useSelectedLayoutSegment() === null) return null;
  return (
    <GlassPillLink size="sm" onImage href={href} className="fixed top-4 left-4 z-[60]">
      <span aria-hidden>←</span> Dev
    </GlassPillLink>
  );
}
