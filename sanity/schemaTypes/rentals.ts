import { defineArrayMember, defineField, defineType } from "sanity";
import { imageArrayMember, languageField, orderField, slugField } from "./fields";

// Rentals are quote-only, so there are deliberately no price fields.
export const rentalCategory = defineType({
  name: "rentalCategory",
  title: "Rental category",
  type: "document",
  fields: [
    languageField,
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    slugField("title"),
    orderField,
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
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
      title: "Max per quote",
      type: "number",
      description: "The most of this item one quote can ask for (e.g. how many you own). Leave empty for no limit.",
      validation: (rule) => rule.integer().min(1).max(99),
    }),
    defineField({
      name: "available",
      type: "boolean",
      initialValue: true,
      description: "Untick to hide the item from the rentals catalogue.",
    }),
    orderField,
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", subtitle: "brand", media: "images.0" },
  },
});
