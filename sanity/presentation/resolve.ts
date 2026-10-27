import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";

// Only the home page reads from the CMS so far; later phases add project/talent/rental routes.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    siteSettings: defineLocations({
      locations: [{ title: "Home", href: "/" }],
    }),
  },
};
