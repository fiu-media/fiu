import { defineArrayMember, defineField, defineType } from "sanity";

// Written by the site's server actions (see #10). Editors can only change `status`.
const readOnly = true;

export const quoteRequest = defineType({
  name: "quoteRequest",
  title: "Quote request",
  type: "document",
  fields: [
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Quoted", value: "quoted" },
          { title: "Booked", value: "booked" },
          { title: "Declined", value: "declined" },
        ],
        layout: "radio",
      },
      initialValue: "new",
    }),
    defineField({ name: "name", type: "string", readOnly }),
    defineField({ name: "email", type: "string", readOnly }),
    defineField({ name: "phone", type: "string", readOnly }),
    defineField({ name: "company", type: "string", readOnly }),
    defineField({ name: "production", type: "string", readOnly }),
    defineField({ name: "startDate", type: "date", readOnly }),
    defineField({ name: "endDate", type: "date", readOnly }),
    defineField({
      name: "items",
      type: "array",
      readOnly,
      of: [
        defineArrayMember({
          name: "line",
          type: "object",
          fields: [
            defineField({ name: "item", type: "reference", to: [{ type: "rentalItem" }], readOnly }),
            defineField({ name: "qty", title: "Quantity", type: "number", readOnly }),
          ],
          preview: { select: { title: "item.name", subtitle: "qty" } },
        }),
      ],
    }),
    defineField({ name: "message", type: "text", readOnly }),
    defineField({ name: "createdAt", type: "datetime", readOnly }),
  ],
  orderings: [{ title: "Newest first", name: "newest", by: [{ field: "createdAt", direction: "desc" }] }],
  preview: {
    select: { title: "name", status: "status", production: "production" },
    prepare: ({ title, status, production }) => ({
      title,
      subtitle: [status, production].filter(Boolean).join(" · "),
    }),
  },
});

export const contactMessage = defineType({
  name: "contactMessage",
  title: "Contact message",
  type: "document",
  fields: [
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Replied", value: "replied" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "new",
    }),
    defineField({ name: "name", type: "string", readOnly }),
    defineField({ name: "email", type: "string", readOnly }),
    defineField({
      name: "enquiryType",
      type: "string",
      readOnly,
      options: { list: ["Project", "Talent", "Rentals", "Other"] },
    }),
    defineField({ name: "message", type: "text", readOnly }),
    defineField({ name: "createdAt", type: "datetime", readOnly }),
  ],
  orderings: [{ title: "Newest first", name: "newest", by: [{ field: "createdAt", direction: "desc" }] }],
  preview: {
    select: { title: "name", status: "status", enquiry: "enquiryType" },
    prepare: ({ title, status, enquiry }) => ({
      title,
      subtitle: [status, enquiry].filter(Boolean).join(" · "),
    }),
  },
});
