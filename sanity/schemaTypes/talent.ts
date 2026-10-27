import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt, languageField, orderField, slugField, vimeoUrlField } from "./fields";

export const talent = defineType({
  name: "talent",
  title: "Talent",
  type: "document",
  fields: [
    languageField,
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    slugField("name"),
    defineField({
      name: "roles",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    imageWithAlt("portrait", "Portrait", true),
    defineField({ name: "bio", type: "array", of: [defineArrayMember({ type: "block" })] }),
    vimeoUrlField("showreelUrl", "Showreel Vimeo URL"),
    orderField,
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", roles: "roles", media: "portrait" },
    prepare: ({ title, roles, media }) => ({ title, subtitle: (roles ?? []).join(", "), media }),
  },
});
