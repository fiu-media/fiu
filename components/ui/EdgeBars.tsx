/**
 * Thin fixed bars along the top and bottom edges, in the surface colour. Safari (iOS 26+) tints its
 * status bar and toolbar from fixed elements at those edges and ignores theme-color for it, so
 * without these the bars fall back to a neutral gradient. They grow to the safe-area inset where
 * there is one (notch in landscape, home indicator in a standalone app). Render inside a
 * [data-surface] wrapper so `bg-bg` resolves to that surface's colour.
 */
export function EdgeBars() {
  return (
    <>
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[max(12px,env(safe-area-inset-top))] bg-bg" />
      <div aria-hidden className="fixed inset-x-0 bottom-0 z-50 h-[max(12px,env(safe-area-inset-bottom))] bg-bg" />
    </>
  );
}
