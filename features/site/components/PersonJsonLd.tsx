import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

import { personGraph } from "../jsonLd";
import { JsonLd } from "./JsonLd";

type PersonJsonLdProps = {
  lang: Locale;
  name: string;
  slug: string;
  roles: readonly string[];
  description: string | null;
  imageUrl: string | null;
};

/** Structured data for one talent profile: Person, plus breadcrumbs. */
export async function PersonJsonLd({ lang, name, slug, roles, description, imageUrl }: PersonJsonLdProps) {
  const { site, nav } = await getDictionary(lang);
  return (
    <JsonLd
      data={personGraph({
        lang,
        name,
        slug,
        roles,
        description,
        imageUrl,
        crumbs: { home: site.name, talent: nav.talent },
      })}
    />
  );
}
