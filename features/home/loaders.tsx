import { PortableText } from "next-sanity";

import { WORK_QUERY } from "@/content/project";
import { ContactLinks, getSiteSettings, HOME_STILLS_QUERY, toTeam } from "@/content/siteSettings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href, routes } from "@/lib/routes";
import { editAttr } from "@/sanity/lib/editing";
import { fetchContent } from "@/sanity/lib/fetch";

import type { HomeFoldProps } from "./components/HomeFold";
import { fallbackHeroStills } from "./fallback-stills";
import { type HeroStills, toFoldProjects, toHeroStills } from "./mappers";

/** The hero's stills from the projects the editors picked, or the bundled ones until there are any. */
export async function getHomeStills(lang: Locale): Promise<HeroStills> {
  const data = await fetchContent(HOME_STILLS_QUERY, lang);
  const stills = toHeroStills(data?.projects ?? []);
  return stills.landscape.length + stills.portrait.length > 0 ? stills : fallbackHeroStills;
}

/**
 * Home's fold, from the same Site settings and projects as About and Our Work (their cached queries are shared, so
 * this adds no fetch).
 */
export async function getHomeFold(lang: Locale): Promise<HomeFoldProps> {
  const [dict, settings, work] = await Promise.all([getDictionary(lang), getSiteSettings(lang), fetchContent(WORK_QUERY, lang)]);
  const { _id, slogan, sloganGloss, manifesto } = settings;

  return {
    about: {
      // The brand line stays Irish in every language, so the dictionary's copy of it is the right fallback.
      slogan: slogan ?? dict.site.description,
      gloss: sloganGloss ?? null,
      // Only the first paragraph: this is the condensed About.
      summary: manifesto?.length ? <PortableText value={manifesto.slice(0, 1)} /> : null,
      href: href(lang, routes.about()),
    },
    team: toTeam(settings, dict.about.teamHeading),
    teamAttribute: _id ? editAttr("siteSettings", _id, "teamStill") : undefined,
    contacts: (
      <ContactLinks
        variant="list"
        contact={settings.contact}
        labels={{ email: dict.about.emailLabel, instagram: dict.about.instagramLabel }}
      />
    ),
    projects: toFoldProjects(work.projects, lang),
    workHref: href(lang, routes.work()),
    labels: {
      about: dict.nav.about,
      work: dict.nav.work,
      aboutCta: dict.nav.about,
      workCta: dict.work.back,
      view: dict.work.view,
    },
  };
}
