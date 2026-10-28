import { defineArrayMember, defineField, defineType } from "sanity";

// Written by the site's server actions (see #10). Editors can only change `status`.
const readOnly = true;

// List and header previews: enough to tell requests apart and see what's outstanding at a glance.
const capitalise = (value?: string) => (value ? value[0].toUpperCase() + value.slice(1) : undefined);
const shortDate = (date?: string) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IE", { day: "numeric", month: "short" }) : undefined;
const excerpt = (text?: string, length = 70) => {
  const flat = text?.replace(/\s+/g, " ").trim();
  return flat && flat.length > length ? `${flat.slice(0, length).trimEnd()}…` : flat;
};

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
    select: {
      name: "name",
      production: "production",
      company: "company",
      status: "status",
      startDate: "startDate",
      endDate: "endDate",
      items: "items",
    },
    prepare: ({ name, production, company, status, startDate, endDate, items }) => {
      const lines = Array.isArray(items) ? items.length : 0;
      return {
        title: [name, production || company].filter(Boolean).join(" · "),
        subtitle: [
          capitalise(status),
          startDate && endDate && startDate !== endDate
            ? `${shortDate(startDate)} → ${shortDate(endDate)}`
            : shortDate(startDate),
          lines ? `${lines} ${lines === 1 ? "item" : "items"}` : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    },
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
    select: { name: "name", enquiry: "enquiryType", status: "status", message: "message" },
    prepare: ({ name, enquiry, status, message }) => ({
      title: [name, enquiry].filter(Boolean).join(" · "),
      subtitle: [capitalise(status), excerpt(message)].filter(Boolean).join(" · "),
    }),
  },
});
