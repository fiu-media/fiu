import { defineField, defineType } from "sanity";

export const launchGate = defineType({
  name: "launchGate",
  title: "Launch",
  type: "document",
  fields: [
    defineField({
      name: "launchAt",
      title: "Launch date and time",
      type: "datetime",
      description:
        "Until this moment the public sees only the logo, and only signed-in staff can see the site. Set it to a time in the past to open the site now. It applies to the live site within a minute.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { launchAt: "launchAt" },
    prepare: ({ launchAt }: { launchAt?: string }) => ({
      title: "Launch",
      subtitle: launchAt ? new Date(launchAt).toUTCString() : "No date set: the site stays closed",
    }),
  },
});
