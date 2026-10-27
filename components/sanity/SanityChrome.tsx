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
  return (
    <>
      <SanityLive includeDrafts={isEnabled} />
      {isEnabled && (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      )}
    </>
  );
}
