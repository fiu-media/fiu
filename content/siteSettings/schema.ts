import { defineArrayMember, defineField, defineType } from "sanity";

import { defaultLanguageReference, imageWithAlt, languageField } from "../../sanity/schema/fields";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "home", title: "Home", default: true },
    { name: "about", title: "About" },
    { name: "pages", title: "Page text" },
    { name: "contact", title: "Contact" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    languageField,
    defineField({
      name: "slogan",
      title: "Slogan",
      type: "string",
      group: "home",
      description: "The brand line. Keep it in Irish in every language.",
    }),
    defineField({
      name: "sloganGloss",
      title: "Slogan translation",
      type: "string",
      group: "home",
      description: "Optional, in this document's language. Leave empty for Irish.",
    }),
    defineField({
      name: "homeProjects",
      title: "Home projects",
      type: "array",
      group: "home",
      description:
        "The projects whose stills rotate behind the logo on the home page, using their landscape and mobile stills. Up to 10 stills are shown, taken from each project in turn.",
      validation: (rule) => rule.required().min(1).max(10),
      of: [defineArrayMember(defaultLanguageReference("project"))],
    }),
    defineField({ name: "manifesto", type: "array", group: "about", of: [defineArrayMember({ type: "block" })] }),
    imageWithAlt("aboutStill", "About still"),
    {
      ...imageWithAlt("teamStill", "Team photo"),
      group: "about",
      description:
        "A photo of the whole team, shown on the About page and under the first screen of Home. Landscape works best (it is cropped to 4:3 on phones and a taller frame on desktop). Until one is added a stand-in photo is shown.",
    },
    defineField({
      name: "teamCaption",
      title: "Team photo caption",
      type: "string",
      group: "about",
      description: "Optional, in this document's language: who is in the photo, where, when. Leave empty to show no caption.",
    }),
    ...(
      [
        ["about", "About"],
        ["work", "Our Work"],
        ["talent", "Talent"],
        ["rentals", "Rentals"],
        ["contact", "Contact"],
      ] as const
    ).map(([page, label]) =>
      defineField({
        name: `${page}Tagline`,
        title: `${label}: Fiú line`,
        type: "string",
        group: "pages",
        description: `A playful line shown under the ${label} title. Leave empty to hide it.`,
      }),
    ),
    defineField({
      name: "rentalsIntro",
      title: "Rentals intro",
      type: "text",
      rows: 3,
      group: "pages",
      description: "The line under the Rentals title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "quoteIntro",
      title: "Request a quote intro",
      type: "text",
      rows: 3,
      group: "pages",
      description: "The line under the Request a quote title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contactIntro",
      title: "Contact intro",
      type: "text",
      rows: 3,
      group: "pages",
      description: "The line under the Contact title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "workIntro",
      title: "Our Work intro",
      type: "text",
      rows: 3,
      group: "pages",
      description: "The line under the Our Work title. Leave empty to show just the title.",
    }),
    defineField({
      name: "talentIntro",
      title: "Talent intro",
      type: "text",
      rows: 3,
      group: "pages",
      description: "The line under the Talent title. Leave empty to show just the title.",
    }),
    defineField({ name: "instagram", title: "Instagram URL", type: "url", group: "contact" }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      group: "contact",
      description:
        "Shown on the site and linked with mailto:. Either form of an internationalised domain (fiú.ie or xn--fi-ska.ie) is fine; the site shows it in Unicode.",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "quoteRecipient",
      title: "Quote request recipient",
      type: "string",
      group: "contact",
      description: "Where new rental quote requests are emailed.",
      validation: (rule) => rule.email(),
    }),
    defineField({ name: "seoTitle", title: "Default title", type: "string", group: "seo" }),
    defineField({ name: "seoDescription", title: "Default description", type: "text", rows: 3, group: "seo" }),
    defineField({ name: "seoImage", title: "Default share image", type: "image", group: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
