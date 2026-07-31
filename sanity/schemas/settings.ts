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
      group: "site",
      title: "Brand name",
      type: "string",
      initialValue: "mattborowczyk",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      group: "site",
      title: "Tagline",
      type: "string",
      initialValue: "Jewellery & Objects",
    }),
    defineField({
      name: "email",
      group: "site",
      title: "Brand email",
      type: "string",
      description: "Used for commission mailto links and the footer.",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "instagram",
      group: "site",
      title: "Instagram URL",
      type: "url",
    }),
    defineField({
      name: "footer",
      group: "site",
      title: "Footer text",
      type: "string",
      initialValue: "Made to order",
    }),
    defineField({
      name: "categories",
      group: "site",
      title: "Portfolio categories",
      type: "array",
      of: [{ type: "string" }],
      description:
        'Filter taxonomy, in display order. "All pieces" is prepended automatically.',
    }),

    // ── Coming soon ────────────────────────────────────────────────────────
    defineField({
      name: "maintenanceMode",
      title: "Coming soon mode",
      type: "boolean",
      group: "maintenance",
      initialValue: false,
      description:
        "When on, every public page (portfolio, course, contact, links) is replaced by the coming soon screen. The Studio at /admin stays open, and local development is never affected.",
    }),
    defineField({
      name: "maintenanceHeadline",
      title: "Coming soon headline",
      type: "string",
      group: "maintenance",
      initialValue: "Back shortly.",
    }),
    defineField({
      name: "maintenanceMessage",
      title: "Coming soon message",
      type: "text",
      rows: 3,
      group: "maintenance",
      initialValue:
        "The studio site is being reworked. Commissions are still open — get in touch by email.",
    }),
  ],
  groups: [
    { name: "site", title: "Site", default: true },
    { name: "maintenance", title: "Coming soon" },
  ],
  preview: {
    select: { title: "name" },
    prepare: ({ title }) => ({ title: "Site Settings", subtitle: title }),
  },
});
