import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";
import { localizedPath, type Locale } from "../../lib/i18n/config";

// Home and rentals read from the CMS so far; later phases add project/talent routes.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
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
