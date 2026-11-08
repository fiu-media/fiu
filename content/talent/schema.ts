import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineArrayMember, defineField, defineType } from "sanity";

import {
  defaultLanguageReference,
  imageWithAlt,
  languageField,
  readOnlyInTranslation,
  slugField,
  vimeoUrlField,
} from "../../sanity/schema/fields";

export const talent = defineType({
  name: "talent",
  title: "Talent",
  type: "document",
  fields: [
    languageField,
    defineField({ name: "name", type: "string", readOnly: readOnlyInTranslation, validation: (rule) => rule.required() }),
    slugField("name"),
    defineField({
      name: "roles",
      type: "array",
      of: [defineArrayMember(defaultLanguageReference("role"))],
      readOnly: readOnlyInTranslation,
    }),
    imageWithAlt("portrait", "Portrait", true),
    defineField({
      name: "bio",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      description: "Short: a paragraph or two, shown beside the portrait on their page.",
    }),
    vimeoUrlField("showreelUrl", "Showreel Vimeo URL"),
    defineField({
      name: "available",
      type: "boolean",
      initialValue: true,
      readOnly: readOnlyInTranslation,
      validation: (rule) => rule.required(),
      description: "Untick if they can't take on work right now. Not currently used on the website.",
    }),
    orderRankField({ type: "talent" }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    // Roles are references; previews can only dereference a fixed number of array entries.
    select: { title: "name", role0: "roles.0.title", role1: "roles.1.title", role2: "roles.2.title", media: "portrait" },
    prepare: ({ title, role0, role1, role2, media }) => ({
      title,
      subtitle: [role0, role1, role2].filter(Boolean).join(", "),
      media,
    }),
  },
});
