import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineArrayMember, defineField, defineType } from "sanity";
import {
  defaultLanguageReference,
  imageArrayMember,
  imageWithAlt,
  languageField,
  readOnlyInTranslation,
  slugField,
  vimeoUrlField,
} from "../../sanity/schema/fields";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    languageField,
    defineField({ name: "title", type: "string", readOnly: readOnlyInTranslation, validation: (rule) => rule.required() }),
    slugField("title"),
    defineField({
      name: "type",
      ...defaultLanguageReference("projectType"),
      readOnly: readOnlyInTranslation,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "client", type: "string", readOnly: readOnlyInTranslation }),
    defineField({
      name: "year",
      type: "number",
      readOnly: readOnlyInTranslation,
      validation: (rule) => rule.integer().min(1990).max(2100),
    }),
    imageWithAlt("coverStill", "Cover still", true),
    defineField({
      ...imageWithAlt("coverStillMobile", "Cover still (mobile)"),
      description: "Portrait (9:16) version shown on phones. Leave empty to crop the cover still instead.",
    }),
    defineField({
      name: "stills",
      title: "Stills gallery",
      type: "array",
      description: "Landscape stills.",
      of: [imageArrayMember()],
    }),
    defineField({
      name: "stillsMobile",
      title: "Stills gallery (mobile)",
      type: "array",
      description: "Portrait (9:16) stills for phones. Pick different moments from the landscape gallery.",
      of: [imageArrayMember()],
    }),
    vimeoUrlField("vimeoUrl", "Vimeo URL"),
    vimeoUrlField("previewLoopUrl", "Preview loop Vimeo URL", "Short silent loop shown on hover in the Work grid."),
    defineField({ name: "description", type: "array", of: [defineArrayMember({ type: "block" })] }),
    defineField({
      name: "credits",
      type: "array",
      readOnly: readOnlyInTranslation,
      of: [
        defineArrayMember({
          name: "credit",
          type: "object",
          fields: [
            defineField({ name: "role", ...defaultLanguageReference("role"), validation: (rule) => rule.required() }),
            defineField({
              name: "talent",
              type: "reference",
              to: [{ type: "talent" }],
              description: "Pick someone on the roster, or just type a name below.",
            }),
            defineField({ name: "name", title: "Name (if not on the roster)", type: "string" }),
          ],
          validation: (rule) =>
            rule.custom((credit) => (credit?.talent || credit?.name ? true : "Pick a talent or enter a name")),
          preview: {
            select: { role: "role.title", talent: "talent.name", name: "name" },
            prepare: ({ role, talent, name }) => ({ title: role, subtitle: talent ?? name }),
          },
        }),
      ],
    }),
    defineField({ name: "featured", type: "boolean", initialValue: false, readOnly: readOnlyInTranslation }),
    orderRankField({ type: "project" }),
  ],
  orderings: [orderRankOrdering, { title: "Year, newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] }],
  preview: {
    select: { title: "title", type: "type.title", year: "year", media: "coverStill" },
    prepare: ({ title, type, year, media }) => ({
      title,
      subtitle: [type, year].filter(Boolean).join(" · "),
      media,
    }),
  },
});
