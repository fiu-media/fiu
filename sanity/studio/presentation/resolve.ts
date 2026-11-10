import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";

import { defaultLocale, type Locale } from "../../../lib/i18n/config";
import { href, routes } from "../../../lib/routes";

type Location = { title: string; href: string };

/** The language a document was written in; documents from before translations existed have none. */
const langOf = (doc: { language?: string | null } | null): Locale => (doc?.language ?? defaultLocale) as Locale;

/**
 * Where Presentation shows a document: its own page (if it has a slug) and, optionally, the index it is listed on.
 * `titleField` is the document field that names the page in the picker.
 */
function pageLocations(options: {
  titleField: "title" | "name";
  fallbackTitle: string;
  page: (slug: string) => string;
  index?: { title: string; path: string };
}) {
  const { titleField, fallbackTitle, page, index } = options;
  return defineLocations({
    select: { title: titleField, slug: "slug.current", language: "language" },
    resolve: (doc) => {
      const lang = langOf(doc);
      const locations: Location[] = [
        ...(doc?.slug ? [{ title: doc.title ?? fallbackTitle, href: href(lang, page(doc.slug)) }] : []),
        ...(index ? [{ title: index.title, href: href(lang, index.path) }] : []),
      ];
      return { locations };
    },
  });
}

// Home, rentals, talent and Our Work read from the CMS so far.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    project: pageLocations({
      titleField: "title",
      fallbackTitle: "Project",
      page: routes.project,
      index: { title: "Our Work", path: routes.work() },
    }),
    talent: pageLocations({
      titleField: "name",
      fallbackTitle: "Talent",
      page: routes.person,
      index: { title: "Talent index", path: routes.talent() },
    }),
    rentalItem: pageLocations({ titleField: "name", fallbackTitle: "Rental item", page: routes.rentalItem }),
    siteSettings: defineLocations({
      select: { language: "language" },
      resolve: (doc) => ({
        locations: [{ title: "Home", href: href(langOf(doc), routes.home()) }],
      }),
    }),
  },
};
