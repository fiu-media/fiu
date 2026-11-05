"use client";

/**
 * Runs a tiny script synchronously during HTML parsing (before first paint) on hard
 * navigations. A Client Component so the browser's own render gets the inert `text/plain` copy
 * (a server component always sees `window` as undefined and would ship `text/javascript` to React,
 * which warns about script tags). See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
