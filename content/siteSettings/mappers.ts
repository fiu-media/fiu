import { type SizedImage, toSizedImage } from "@/sanity/lib/image";

import type { SiteSettings } from "./loaders";

export type Team = {
  image: SizedImage;
  /** e.g. "The team". */
  heading: string;
  /** Who is in the photo, where, when. Optional. */
  caption: string | null;
};

/**
 * The team photo for About and Home: the editors' photo and caption, or `null` until they upload one (Site settings →
 * About), in which case neither page shows a photo. `width` is the widest the photo is drawn (both frame it at about 40vw).
 */
export function toTeam(settings: Pick<SiteSettings, "teamStill" | "teamCaption">, heading: string, width = 1600): Team | null {
  const image = settings.teamStill ? toSizedImage(settings.teamStill, width) : null;
  return image ? { image, heading, caption: settings.teamCaption } : null;
}
