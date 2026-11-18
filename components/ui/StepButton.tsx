import { ChevronLeft, ChevronRight } from "lucide-react";

import { GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";

// `light` is glass over a dark backdrop (the stills lightbox); `dark` is a solid disc over a bright photo (the rental gallery).
const tones = {
  light: { base: "size-11 px-0", left: "left-2 md:left-6", right: "right-2 md:right-6" },
  dark: {
    base: "grid size-11 cursor-pointer place-items-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink",
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
  const className = cn("absolute top-1/2 -translate-y-1/2", look.base, look[side]);
  const icon = side === "left" ? <ChevronLeft aria-hidden className="size-5" /> : <ChevronRight aria-hidden className="size-5" />;
  return tone === "light" ? (
    <GlassPillButton onImage onClick={onClick} aria-label={label} className={className}>
      {icon}
    </GlassPillButton>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {icon}
    </button>
  );
}
