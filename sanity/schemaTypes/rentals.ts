import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineArrayMember, defineField, defineType } from "sanity";
import { imageArrayMember, languageField, readOnlyInTranslation, slugField } from "./fields";

// Rentals are quote-only, so there are deliberately no price fields.
export const rentalCategory = defineType({
  name: "rentalCategory",
  title: "Rental category",
  type: "document",
  fields: [
    languageField,
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    slugField("title"),
    orderRankField({ type: "rentalCategory" }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: "title" } },
});

export const rentalItem = defineType({
  name: "rentalItem",
  title: "Rental item",
  type: "document",
  fields: [
    languageField,
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    slugField("name"),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "rentalCategory" }],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "brand", type: "string" }),
    defineField({ name: "images", type: "array", of: [imageArrayMember()] }),
    defineField({ name: "summary", type: "text", rows: 3 }),
    defineField({
      name: "keyFeatures",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "specs",
      type: "array",
      of: [
        defineArrayMember({
          name: "spec",
          type: "object",
          fields: [
            defineField({ name: "key", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "value", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "key", subtitle: "value" } },
        }),
      ],
    }),
    defineField({
      name: "includedInKit",
      title: "Included in kit",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "maxQuantity",
      title: "Inventory",
      type: "number",
      description: "How many of this item you own. A quote can't ask for more than this.",
      readOnly: readOnlyInTranslation,
      validation: (rule) => rule.required().integer().min(1).max(99),
    }),
    defineField({
      name: "available",
      type: "boolean",
      initialValue: true,
      readOnly: readOnlyInTranslation,
      description: "Untick to hide the item from the rentals catalogue.",
    }),
    orderRankField({ type: "rentalItem" }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: "name", subtitle: "brand", media: "images.0" },
  },
});
