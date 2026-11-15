import { cn } from "@/lib/cn";

/**
 * The phone menu's icon: bars that turn into the X as the menu opens, and back as it closes. The pose is set by CSS
 * (`.menu-glyph` in globals.css) from the state the parent already carries: `data-popup-open` on a Base UI trigger, or
 * the starting and ending styles of the popup for the Close button that sits over it, so the icon keeps its place while
 * the menu opens around it.
 */
/** `open`: shown as the X, for the Close button inside the menu, which eases back to bars while the menu opens and closes. */
export function MenuGlyph({ open, className }: { open?: boolean; className?: string }) {
  return (
    <span aria-hidden data-open={open ? "" : undefined} className={cn("menu-glyph", className)}>
      <span />
      <span />
      <span />
    </span>
  );
}
