import type { Team } from "@/components/about/TeamFigure";
import { fallbackStills } from "@/lib/fallback-stills";
import { toSizedImage, type QueriedImage } from "./rentals";

/** Shown until the editors upload a team photo (Site settings → About), the way About falls back to a project still. */
const standIn = fallbackStills[2 % fallbackStills.length]!;

/**
 * The team photo for About and Home from `ABOUT_QUERY`'s result: the editors' photo and caption, or a stand-in still.
 * `width` is the widest the photo is drawn (Home and About both frame it at about 40vw).
 */
export function toTeam(settings: { team: QueriedImage | null; teamCaption: string | null }, heading: string, width = 1600): Team {
  const image = (settings.team ? toSizedImage(settings.team, width) : null) ?? {
    src: standIn.src,
    width: standIn.width,
    height: standIn.height,
    alt: standIn.alt,
    blurDataURL: standIn.blurDataURL,
  };
  return { image, heading, caption: settings.teamCaption };
}
