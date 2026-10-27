import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";
import { localizedPath, type Locale } from "../../lib/i18n/config";

// Only the home page reads from the CMS so far; later phases add project/talent/rental routes.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    siteSettings: defineLocations({
      select: { language: "language" },
      resolve: (doc) => ({
        locations: [{ title: "Home", href: localizedPath((doc?.language ?? "en") as Locale, "/") }],
      }),
    }),
  },
};
