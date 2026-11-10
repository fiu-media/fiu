/**
 * Carries the scroll position across a language switch. The locale is a route segment above the root layout, so
 * switching it mounts a whole new page tree at the top. Module state survives that (the window does), so the switcher
 * leaves the position here and the new tree's LanguageScrollRestore picks it up.
 */
let carried: { pathname: string; y: number } | null = null;

/** Remembers `y` for the page that `pathname` is about to show. */
export function carryScroll(pathname: string, y: number) {
  carried = { pathname, y };
}

/** The carried position if it was left for `pathname`; it is handed over once. */
export function takeCarriedScroll(pathname: string): number | null {
  const found = carried;
  if (found?.pathname !== pathname) return null;
  carried = null;
  return found.y;
}
