import { defineField, defineType } from "sanity";

/**
 * Site-wide settings — singleton. Mirrors `site` and `categories` in
 * lib/site.ts. Singleton behaviour (fixed id, no create/delete/duplicate) is
 * enforced in sanity/structure.ts + sanity.config.ts.
 */
export const settingsSchema = defineType({
  name: "settings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Brand name",
      type: "string",
      initialValue: "mattborowczyk",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      initialValue: "Jewellery & Objects",
    }),
    defineField({
      name: "email",
      title: "Brand email",
      type: "string",
      description: "Used for commission mailto links and the footer.",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
    }),
    defineField({
      name: "footer",
      title: "Footer text",
      type: "string",
      initialValue: "Made to order",
    }),
    defineField({
      name: "categories",
      title: "Catalogue categories",
      type: "array",
      of: [{ type: "string" }],
      description:
        'Filter taxonomy, in display order. "Shop all" is prepended automatically.',
    }),
  ],
  preview: {
    select: { title: "name" },
    prepare: ({ title }) => ({ title: "Site Settings", subtitle: title }),
  },
});
