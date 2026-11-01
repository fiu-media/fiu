"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

/** Lets an editor leave draft mode when previewing outside the Studio's Presentation tool. */
export function DisableDraftMode() {
  // null until known, true inside the Studio iframe
  if (useIsPresentationTool() !== false) return null;

  return (
    // A form, not a link: it changes state, and a plain GET submit can't be prefetched.
    <form
      action="/api/draft-mode/disable"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50"
    >
      <button type="submit" className="rounded-full bg-black/80 px-4 py-2 text-sm text-white backdrop-blur">
        Exit draft mode
      </button>
    </form>
  );
}
