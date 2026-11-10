import { projectMeta } from "@/content/project";
import { at } from "@/lib/at";
import type { Locale } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";
import type { HOME_STILLS_QUERY_RESULT, WORK_QUERY_RESULT } from "@/sanity.types";
import { editAttr } from "@/sanity/lib/editing";
import { type SizedImage, toSizedImage } from "@/sanity/lib/image";

import type { FoldProject } from "./components/HomeFold";

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
    return [{ ...image, dataSanity: editAttr("project", projectId, `${field}[_key=="${still._key}"]`) }];
  });
}

/** One from each list in turn, then the next of each, up to `MAX_HERO_STILLS`. */
function takeTurns(lists: HeroStill[][]): HeroStill[] {
  const out: HeroStill[] = [];
  for (let i = 0; out.length < MAX_HERO_STILLS && lists.some((l) => i < l.length); i++) {
    for (const list of lists) {
      if (i < list.length && out.length < MAX_HERO_STILLS) out.push(at(list, i));
    }
  }
  return out;
}

/** How many projects the fold's strip shows before "All work". */
export const STRIP_PROJECTS = 5;

/** The first projects of Our Work for the fold's strip; one without a cover or a slug is skipped. */
export function toFoldProjects(projects: WORK_QUERY_RESULT["projects"], lang: Locale): FoldProject[] {
  return projects
    .flatMap((project): FoldProject[] => {
      const image = project.cover.landscape ? toSizedImage(project.cover.landscape, 1600) : null;
      if (!image || !project.slug) return [];
      return [
        {
          id: project._id,
          title: project.title,
          meta: projectMeta(project),
          image,
          href: href(lang, routes.project(project.slug)),
        },
      ];
    })
    .slice(0, STRIP_PROJECTS);
}
