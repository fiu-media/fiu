import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";
import { languageField, slugField } from "./fields";

// Editor-managed vocabularies, like rental categories: the code never lists them. Projects and
// talent reference the default-language document; other languages translate the title only.

export const projectType = defineType({
  name: "projectType",
  title: "Project type",
  type: "document",
  fields: [
    languageField,
    defineField({
      name: "title",
      type: "string",
      description: "Singular, as shown on a project (e.g. Music video).",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pluralTitle",
      type: "string",
      description: "Shown on the Our Work filter (e.g. Music videos). Leave empty to use the title.",
    }),
    slugField("title"),
    orderRankField({ type: "projectType" }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: "title" } },
});

export const role = defineType({
  name: "role",
  title: "Role",
  type: "document",
  fields: [
    languageField,
    defineField({
      name: "title",
      type: "string",
      description: "A crew or talent role (e.g. Director of Photography).",
      validation: (rule) => rule.required(),
    }),
    slugField("title"),
    orderRankField({ type: "role" }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: "title" } },
});
