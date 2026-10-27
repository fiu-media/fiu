import { defineField } from "sanity";

export const orderField = defineField({
  name: "order",
  title: "Order",
  type: "number",
  description: "Lower numbers appear first.",
  initialValue: 100,
});

export const slugField = (source: string) =>
  defineField({
    name: "slug",
    type: "slug",
    options: { source, maxLength: 96 },
    validation: (rule) => rule.required(),
  });

export const vimeoUrlField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: "url",
    description,
    validation: (rule) =>
      rule.uri({ scheme: ["https"] }).custom((url) => {
        if (!url) return true;
        return /^https:\/\/(www\.|player\.)?vimeo\.com\//.test(url) || "Must be a vimeo.com link";
      }),
  });

/** An image with hotspot/crop and the alt text editors must fill in. */
export const imageWithAlt = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        description: "Describe the image for people who can't see it.",
        validation: (rule) => rule.required(),
      }),
    ],
    validation: required ? (rule) => rule.required() : undefined,
  });
