"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

/** Lets an editor leave draft mode when previewing outside the Studio's Presentation tool. */
export function DisableDraftMode() {
  // null until known, true inside the Studio iframe
  if (useIsPresentationTool() !== false) return null;

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed right-4 bottom-4 z-50 rounded-full bg-black/80 px-4 py-2 text-sm text-white backdrop-blur"
    >
      Exit draft mode
    </a>
  );
}
