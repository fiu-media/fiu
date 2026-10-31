import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";
import { localizedPath, type Locale } from "../../lib/i18n/config";

// Home, rentals, talent and Our Work read from the CMS so far.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    project: defineLocations({
      select: { title: "title", language: "language" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title ?? "Project", href: localizedPath((doc?.language ?? "en") as Locale, "/work") }],
      }),
    }),
    talent: defineLocations({
      select: { name: "name", slug: "slug.current", language: "language" },
      resolve: (doc) => {
        const lang = (doc?.language ?? "en") as Locale;
        return {
          locations: [
            ...(doc?.slug ? [{ title: doc.name ?? "Talent", href: localizedPath(lang, `/talent/${doc.slug}`) }] : []),
            { title: "Talent index", href: localizedPath(lang, "/talent") },
          ],
        };
      },
    }),
    rentalItem: defineLocations({
      select: { name: "name", slug: "slug.current", language: "language" },
      resolve: (doc) => ({
        locations: doc?.slug
          ? [{ title: doc.name ?? "Rental item", href: localizedPath((doc.language ?? "en") as Locale, `/rentals/${doc.slug}`) }]
          : [],
      }),
    }),
    siteSettings: defineLocations({
      select: { language: "language" },
      resolve: (doc) => ({
        locations: [{ title: "Home", href: localizedPath((doc?.language ?? "en") as Locale, "/") }],
      }),
    }),
  },
};
