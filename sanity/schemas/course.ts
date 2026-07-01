import { defineField, defineType } from "sanity";

/**
 * A self-paced course (Jewellery, Grillz — extensible). Mirrors the `Course`
 * interface in lib/courses.ts. The Course page renders all courses behind a
 * segmented toggle, ordered by `order`. `checkoutUrl` may be blank — the Enrol
 * button then renders disabled ("opening soon").
 */
export const courseSchema = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({
      name: "key",
      title: "Key",
      type: "string",
      description: "Stable identifier / toggle value — e.g. jewellery",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "Toggle tab text — e.g. Jewellery",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "Include the currency symbol — e.g. £240",
    }),
    defineField({
      name: "meta",
      title: "Meta line",
      type: "string",
      description: 'e.g. "Lifetime access · 6 modules · 5.5 hours"',
    }),
    defineField({
      name: "level",
      title: "Level",
      type: "string",
      description: 'e.g. "Beginner → intermediate"',
    }),
    defineField({
      name: "length",
      title: "Length",
      type: "string",
      description: 'e.g. "6 modules · ~5.5 hrs"',
    }),
    defineField({
      name: "checkoutUrl",
      title: "Checkout URL",
      type: "url",
      description:
        "External enrol link. Leave blank to render a disabled 'opening soon' button.",
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "no",
              title: "Number",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: "body", title: "Body", type: "text", rows: 2 }),
            defineField({ name: "duration", title: "Duration", type: "string" }),
          ],
          preview: {
            select: { title: "title", subtitle: "duration" },
          },
        },
      ],
    }),
    defineField({
      name: "includes",
      title: "What's included",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first (left-most toggle).",
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "label", subtitle: "headline" },
  },
});
