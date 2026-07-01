import { defineField, defineType } from "sanity";

export const settingsSchema = defineType({
  name: "settings",
  title: "Site Settings",
  type: "document",
  // Singleton — only one settings document should exist. Enforced via
  // structure.ts; proper singleton document actions land in Phase 3.
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site Title",
      type: "string",
      initialValue: "Mateusz Borowczyk",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "newsletterTitle",
      title: "Newsletter Section Title",
      type: "string",
      initialValue: "Stay in the loop",
    }),
    defineField({
      name: "newsletterSubtitle",
      title: "Newsletter Section Subtitle",
      type: "string",
    }),
    defineField({
      name: "social",
      title: "Social Links",
      type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram URL", type: "url" }),
        defineField({ name: "tiktok", title: "TikTok URL", type: "url" }),
        defineField({ name: "youtube", title: "YouTube URL", type: "url" }),
      ],
    }),
    defineField({
      name: "footerText",
      title: "Footer Text",
      type: "string",
      description: "e.g. 'Handcrafted in Warsaw'",
    }),
  ],
  preview: {
    select: { title: "siteTitle" },
  },
});
