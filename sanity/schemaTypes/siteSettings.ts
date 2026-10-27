import { defineArrayMember, defineField, defineType } from "sanity";
import { imageArrayMember, imageWithAlt, languageField } from "./fields";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "home", title: "Home", default: true },
    { name: "about", title: "About" },
    { name: "contact", title: "Contact" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    languageField,
    defineField({ name: "slogan", title: "Slogan (Irish)", type: "string", group: "home" }),
    defineField({ name: "sloganGloss", title: "Slogan (English gloss)", type: "string", group: "home" }),
    defineField({
      name: "homeStills",
      title: "Home stills",
      type: "array",
      group: "home",
      description: "3–10 images that rotate behind the logo on the home page.",
      validation: (rule) => rule.min(3).max(10),
      of: [
        imageArrayMember([
          defineField({
            name: "lightTint",
            title: "Glass tint",
            type: "string",
            description:
              "Optional hex colour (e.g. #a0957b) the glass logo takes from this still. Leave empty to sample the image.",
            validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: "hex colour" }).warning(),
          }),
          defineField({
            name: "project",
            title: "Linked project",
            type: "reference",
            to: [{ type: "project" }],
          }),
        ]),
      ],
    }),
    defineField({ name: "manifesto", type: "array", group: "about", of: [defineArrayMember({ type: "block" })] }),
    imageWithAlt("aboutStill", "About still"),
    defineField({ name: "instagram", title: "Instagram URL", type: "url", group: "contact" }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      group: "contact",
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
