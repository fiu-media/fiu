import { notFound } from "next/navigation";

// Unknown URLs under a locale land here so they render ../not-found.tsx inside the site layout;
// with no root layout, Next would otherwise have nothing to wrap an unmatched route in.
// It never renders a page, so there is no static shell for instant-navigation validation to check.
export const instant = false;

export default function UnmatchedPage(): never {
  notFound();
}
