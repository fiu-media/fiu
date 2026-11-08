import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";

import { SanityLive } from "@/sanity/lib/live";

import { DisableDraftMode } from "./DisableDraftMode";

/**
 * Live content updates, plus the visual-editing overlays and an exit button in draft mode.
 * Reads draftMode(), so render it inside <Suspense> to keep the rest of the layout static.
 */
export async function SanityChrome() {
  const { isEnabled } = await draftMode();
  // The "connected and listening" console.info is dev-only noise; errors and
  // warnings stay. `undefined` falls back to the default handler.
  const quiet = process.env.NODE_ENV === "production";
  return (
    <>
      <SanityLive includeDrafts={isEnabled} onWelcome={quiet ? false : undefined} />
      {isEnabled && (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      )}
    </>
  );
}
