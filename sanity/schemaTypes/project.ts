import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt, orderField, slugField, vimeoUrlField } from "./fields";

export const projectTypes = ["Original", "Commercial", "Music Video", "Short", "Documentary"] as const;

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    slugField("title"),
    defineField({
      name: "type",
      type: "string",
      options: { list: [...projectTypes], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "client", type: "string" }),
    defineField({
      name: "year",
      type: "number",
      validation: (rule) => rule.integer().min(1990).max(2100),
    }),
    imageWithAlt("coverStill", "Cover still", true),
    defineField({
      name: "stills",
      title: "Stills gallery",
      type: "array",
      of: [defineArrayMember(imageWithAlt("still", "Still"))],
    }),
    vimeoUrlField("vimeoUrl", "Vimeo URL"),
    vimeoUrlField("previewLoopUrl", "Preview loop Vimeo URL", "Short silent loop shown on hover in the Work grid."),
    defineField({ name: "description", type: "array", of: [defineArrayMember({ type: "block" })] }),
    defineField({
      name: "credits",
      type: "array",
      of: [
        defineArrayMember({
          name: "credit",
          type: "object",
          fields: [
            defineField({ name: "role", type: "string", validation: (rule) => rule.required() }),
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
            select: { role: "role", talent: "talent.name", name: "name" },
            prepare: ({ role, talent, name }) => ({ title: role, subtitle: talent ?? name }),
          },
        }),
      ],
    }),
    defineField({ name: "featured", type: "boolean", initialValue: false }),
    orderField,
  ],
  orderings: [
    { title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] },
    { title: "Year, newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", type: "type", year: "year", media: "coverStill" },
    prepare: ({ title, type, year, media }) => ({
      title,
      subtitle: [type, year].filter(Boolean).join(" · "),
      media,
    }),
  },
});
