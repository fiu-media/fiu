import { type ReactNode, ViewTransition } from "react";

/**
 * A shared element across a page change: the same `name` on both pages makes the browser carry one into the other
 * on navigation (a still growing into a hero, a name flying into a heading), styled by `.cut`, `.cut-text` and `.cut-fade` in globals.css.
 * `default="none"` keeps it out of every other transition. Without a name it renders the children as they are.
 */
export function Cut({
  name,
  text,
  fade,
  children,
}: {
  name: string | null | undefined;
  /** A line of type: it scales by its height and is never cropped, so a title that wraps differently stays whole. */
  text?: boolean;
  /** Crossfades the two ends, for a pair cropped the same way at both (a portrait) where one end may be hidden. */
  fade?: boolean;
  children: ReactNode;
}) {
  if (!name) return children;
  return (
    <ViewTransition name={name} share={text ? "cut-text" : fade ? "cut-fade" : "cut"} default="none">
      {children}
    </ViewTransition>
  );
}

/** The pairs, named in one place so both ends always agree. Slugs are already CSS-safe (lowercase, digits, dashes). */
export const cutName = {
  still: (slug: string | null | undefined) => slug && `still-${slug}`,
  title: (slug: string | null | undefined) => slug && `title-${slug}`,
  meta: (slug: string | null | undefined) => slug && `meta-${slug}`,
  name: (slug: string | null | undefined) => slug && `name-${slug}`,
  portrait: (slug: string | null | undefined) => slug && `portrait-${slug}`,
};
