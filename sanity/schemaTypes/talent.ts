import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defaultLanguageReference, imageWithAlt, languageField, readOnlyInTranslation, slugField, vimeoUrlField } from "./fields";

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
    defineField({ name: "bio", type: "array", of: [defineArrayMember({ type: "block" })] }),
    vimeoUrlField("showreelUrl", "Showreel Vimeo URL"),
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
