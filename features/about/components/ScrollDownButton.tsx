"use client";

import { ArrowDown } from "lucide-react";
import type { MouseEvent } from "react";

import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";

/** The arrow at the foot of a hero section: scrolls to whatever follows that section. */
export function ScrollDownButton({ label }: { label: string }) {
  function scrollOn(event: MouseEvent<HTMLButtonElement>) {
    const next = event.currentTarget.closest("section")?.nextElementSibling;
    next?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollOn}
      aria-label={label}
      className="-m-3 mt-5 w-fit cursor-pointer rounded-full p-3 text-on-image/60 transition-colors hover:text-on-image focus-visible:text-on-image motion-reduce:transition-none"
    >
      <ArrowDown aria-hidden className="size-5" />
    </button>
  );
}
