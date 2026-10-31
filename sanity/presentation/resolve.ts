import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";
import { localizedPath, type Locale } from "../../lib/i18n/config";

// Home, rentals and talent read from the CMS so far; later phases add the project routes.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
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
