"use client";

import { useEffect } from "react";

/**
 * Sets the browser bar colour while mounted, for a page that can't set it through `viewport`: a 404 that streams in
 * after its route's head was already sent with that route's colours (an unknown rental, say). Put back on the way out.
 */
export function ThemeColor({ color }: { color: string }) {
  useEffect(() => {
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const before = metas.map((meta) => meta.content);
    for (const meta of metas) meta.content = color;
    return () => metas.forEach((meta, i) => (meta.content = before[i]));
  }, [color]);
  return null;
}
