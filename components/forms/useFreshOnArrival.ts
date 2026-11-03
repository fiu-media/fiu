"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that goes up every time a link arrives carrying something to prefill; use it as a `key` to start the
 * form over. Next keeps a page's state while you browse elsewhere (so a half-written message survives a trip to
 * another page), which also means a link like "Work with Aoife" lands on the old form: old answers, old errors, a
 * "Message sent" panel, and none of what the link asked for. A link that carries a prefill gets a fresh form, even
 * if it is the very same link as last time; coming back with a plain link (an empty `prefill`) keeps the draft.
 *
 * "Arrives" is detected from the page being shown again: React runs a kept-alive page's effects afresh each time it
 * is shown, and again when `prefill` changes while it is showing. See `prefillKey` in lib/forms/prefill.ts.
 */
export function useFreshOnArrival(prefill: string) {
  const [fresh, setFresh] = useState(0);
  // False until the first run has settled, so mounting the page doesn't count as an arrival. (In development React
  // runs a mounting effect twice in a row; the timer, which only fires after both, keeps that from counting either.)
  const settled = useRef(false);
  useEffect(() => {
    const arrived = settled.current && prefill !== "";
    const timer = setTimeout(() => {
      settled.current = true;
      if (arrived) setFresh((count) => count + 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [prefill]);
  return fresh;
}
