import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

// `light` sits over a dark backdrop (the stills lightbox); `dark` sits over a bright photo (the rental gallery).
const tones = {
  light: {
    base: "bg-white/10 hover:bg-white/20 max-md:bg-black/40",
    left: "left-2 md:left-6",
    right: "right-2 md:right-6",
  },
  dark: {
    base: "bg-ink/70 text-paper transition-colors hover:bg-ink",
    left: "left-3",
    right: "right-3",
  },
};

/** A round previous/next button, centred on the left or right edge of its (relative) parent. */
export function StepButton({
  label,
  side,
  tone,
  onClick,
}: {
  label: string;
  side: "left" | "right";
  tone: keyof typeof tones;
  onClick: () => void;
}) {
  const look = tones[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full",
        look.base,
        look[side],
      )}
    >
      {side === "left" ? <ChevronLeft aria-hidden className="size-5" /> : <ChevronRight aria-hidden className="size-5" />}
    </button>
  );
}
