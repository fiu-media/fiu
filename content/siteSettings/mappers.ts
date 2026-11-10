import { fallbackStills } from "@/features/home/fallback-stills";
import { type SizedImage, toSizedImage } from "@/sanity/lib/image";

import type { SiteSettings } from "./loaders";

export type Team = {
  image: SizedImage;
  /** e.g. "The team". */
  heading: string;
  /** Who is in the photo, where, when. Optional. */
  caption: string | null;
};

/** Shown until the editors upload a team photo (Site settings → About), the way About falls back to a project still. */
const standIn = fallbackStills[2 % fallbackStills.length]!;

/**
 * The team photo for About and Home: the editors' photo and caption, or a stand-in still.
 * `width` is the widest the photo is drawn (Home and About both frame it at about 40vw).
 */
export function toTeam(settings: Pick<SiteSettings, "teamStill" | "teamCaption">, heading: string, width = 1600): Team {
  const image = (settings.teamStill ? toSizedImage(settings.teamStill, width) : null) ?? standIn;
  return { image, heading, caption: settings.teamCaption };
}
