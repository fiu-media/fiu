import { defineArrayMember, defineField } from "sanity";

export const orderField = defineField({
  name: "order",
  title: "Order",
  type: "number",
  description: "Lower numbers appear first.",
  initialValue: 100,
});

/** Written by @sanity/document-internationalization; editors never touch it. */
export const languageField = defineField({
  name: "language",
  type: "string",
  readOnly: true,
  hidden: true,
});

export const slugField = (source: string) =>
  defineField({
    name: "slug",
    type: "slug",
    options: {
      source,
      maxLength: 96,
      // Translations of one document share a slug, so uniqueness is per language.
      isUnique: async (slug, context) => {
        const { document, getClient } = context;
        if (!document?.language) return context.defaultIsUnique(slug, context);
        const id = document._id.replace(/^drafts\./, "");
        return getClient({ apiVersion: "2025-02-19" }).fetch<boolean>(
          `!defined(*[_type == $type && language == $language && slug.current == $slug && !(_id in [$id, "drafts." + $id])][0]._id)`,
          { type: document._type, language: document.language, slug, id },
        );
      },
    },
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

export const altField = defineField({
  name: "alt",
  title: "Alt text",
  type: "string",
  description: "Describe the image for people who can't see it.",
  validation: (rule) => rule.required(),
});

/** An image with hotspot/crop and the alt text editors must fill in. */
export const imageWithAlt = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [altField],
    validation: required ? (rule) => rule.required() : undefined,
  });

/**
 * An image item for an array. Deliberately unnamed so items keep the plain `image` _type:
 * a named member would require `_type` to match its name, and reject items typed `image`.
 */
export const imageArrayMember = (extraFields: ReturnType<typeof defineField>[] = []) =>
  defineArrayMember({
    type: "image",
    options: { hotspot: true },
    fields: [altField, ...extraFields],
  });
