import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { routes } from "@/lib/routes";

import { projectGraph } from "../jsonLd";
import { JsonLd } from "./JsonLd";

type Credit = { role: string; name: string; talentSlug: string | null };

type ProjectJsonLdProps = {
  lang: Locale;
  title: string;
  slug: string;
  description: string | null;
  type: string | null;
  year: number | null;
  client: string | null;
  imageUrl: string | null;
  vimeoUrl: string | null;
  credits: readonly Credit[];
};

/** Structured data for one project's page: VideoObject or CreativeWork, plus breadcrumbs. */
export async function ProjectJsonLd({
  lang,
  title,
  slug,
  description,
  type,
  year,
  client,
  imageUrl,
  vimeoUrl,
  credits,
}: ProjectJsonLdProps) {
  const { site, nav } = await getDictionary(lang);
  return (
    <JsonLd
      data={projectGraph({
        lang,
        title,
        slug,
        description,
        type,
        year,
        client,
        imageUrl,
        vimeoUrl,
        credits: credits.map((credit) => ({
          role: credit.role,
          name: credit.name,
          path: credit.talentSlug ? routes.person(credit.talentSlug) : null,
        })),
        crumbs: { home: site.name, work: nav.work },
      })}
    />
  );
}
