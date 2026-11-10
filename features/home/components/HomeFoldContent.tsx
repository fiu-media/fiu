import { PortableText } from "next-sanity";

import { WORK_QUERY } from "@/content/project";
import { ABOUT_QUERY } from "@/content/siteSettings";
import { AboutContacts } from "@/features/about";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href, routes } from "@/lib/routes";
import { settingsAttribute } from "@/sanity/lib/about";
import { publishedId, toSizedImage } from "@/sanity/lib/image";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { toTeam } from "@/sanity/lib/team";

import { type FoldProject, HomeFold } from "./HomeFold";

/** How many projects the strip shows before "All work". */
const STRIP_PROJECTS = 5;

/**
 * Home's fold, from the same Site settings and projects as About and Our Work (their cached queries are shared, so
 * this adds no fetch). Reads draft mode, so it streams in below the hero.
 */
export async function HomeFoldContent({ lang }: { lang: Locale }) {
  const [dict, { perspective, variant }] = await Promise.all([getDictionary(lang), getDynamicFetchOptions()]);
  const options = { params: { lang, fallbackLang: defaultLocale }, perspective, variant, stega: false } as const;
  const [{ data: about }, { data: work }] = await Promise.all([
    cachedSanity({ query: ABOUT_QUERY, ...options }),
    cachedSanity({ query: WORK_QUERY, ...options }),
  ]);

  const projects = work.projects
    .flatMap((project): FoldProject[] => {
      const image = project.cover ? toSizedImage(project.cover, 1600) : null;
      if (!image || !project.slug) return [];
      return [
        {
          id: project._id,
          title: project.title,
          meta: [project.type, project.year, project.client].filter(Boolean).join(" · "),
          image,
          href: href(lang, routes.project(project.slug)),
        },
      ];
    })
    .slice(0, STRIP_PROJECTS);

  const id = about._id ? publishedId(about._id) : null;
  return (
    <HomeFold
      about={{
        // The brand line stays Irish in every language, so the dictionary's copy of it is the right fallback.
        slogan: about.slogan ?? dict.site.description,
        gloss: about.sloganGloss ?? null,
        // Only the first paragraph: this is the condensed About.
        summary: about.manifesto?.length ? <PortableText value={about.manifesto.slice(0, 1)} /> : null,
        href: href(lang, routes.about()),
      }}
      team={toTeam(about, dict.about.teamHeading)}
      teamAttribute={id ? settingsAttribute(id, "teamStill") : undefined}
      contacts={
        <AboutContacts
          email={about.contactEmail ?? null}
          instagram={about.instagram ?? null}
          labels={{ email: dict.about.emailLabel, instagram: dict.about.instagramLabel }}
        />
      }
      projects={projects}
      workHref={href(lang, routes.work())}
      labels={{
        about: dict.nav.about,
        work: dict.nav.work,
        aboutCta: dict.nav.about,
        workCta: dict.work.back,
        view: dict.work.view,
      }}
    />
  );
}
