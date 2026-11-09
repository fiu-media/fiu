import type { HOME_STILLS_QUERY_RESULT } from "@/sanity.types";

import { type SizedImage, toSizedImage } from "./image";
import { projectAttribute } from "./projects";

export type HeroStill = SizedImage & {
  /** Precomputed studio tint (hex) for the glass logo; avoids sampling the texture. Only the bundled fallbacks have one. */
  lightTint?: string;
  /** `data-sanity` value that makes the still clickable in the Presentation tool. */
  dataSanity?: string;
};

/** The two sets the hero rotates: landscape for most screens, portrait for phones held upright. */
export type HeroStills = { landscape: HeroStill[]; portrait: HeroStill[] };

type HomeProject = NonNullable<NonNullable<NonNullable<HOME_STILLS_QUERY_RESULT>["projects"]>[number]>;

const HERO_WIDTH = 2400;
/**
 * Portrait stills are only drawn on phones held upright, whose screens are at most about 1320 device pixels wide. The
 * logo scene uploads each still as a texture, so a wider one only costs download time and GPU memory.
 */
const PORTRAIT_HERO_WIDTH = 1320;
/** The most stills one set rotates, which keeps the page's images and the logo scene's textures bounded. */
export const MAX_HERO_STILLS = 10;

/**
 * The stills of the projects the home page rotates. Each project contributes its landscape gallery and its mobile
 * one, or, without a mobile gallery, the landscape stills again (cropped to fit, like a missing mobile cover). The
 * projects take turns, so every one appears even when the cap cuts a set short.
 */
export function toHeroStills(projects: (HomeProject | null)[]): HeroStills {
  const sets = projects.filter((p): p is HomeProject => p !== null).map(toProjectSets);
  return {
    landscape: takeTurns(sets.map((s) => s.landscape)),
    portrait: takeTurns(sets.map((s) => s.portrait)),
  };
}

function toProjectSets(project: HomeProject) {
  const landscape = toStills(project._id, "stills", project.stills);
  const portrait = toStills(project._id, "stillsMobile", project.stillsMobile);
  return { landscape, portrait: portrait.length > 0 ? portrait : landscape };
}

function toStills(projectId: string, field: "stills" | "stillsMobile", stills: HomeProject["stills"]): HeroStill[] {
  return (stills ?? []).flatMap((still) => {
    const image = toSizedImage(still, field === "stillsMobile" ? PORTRAIT_HERO_WIDTH : HERO_WIDTH);
    if (!image) return [];
    return [{ ...image, dataSanity: projectAttribute(projectId, `${field}[_key=="${still._key}"]`) }];
  });
}

/** One from each list in turn, then the next of each, up to `MAX_HERO_STILLS`. */
function takeTurns(lists: HeroStill[][]): HeroStill[] {
  const out: HeroStill[] = [];
  for (let i = 0; out.length < MAX_HERO_STILLS && lists.some((l) => i < l.length); i++) {
    for (const list of lists) {
      if (i < list.length && out.length < MAX_HERO_STILLS) out.push(list[i]!);
    }
  }
  return out;
}
