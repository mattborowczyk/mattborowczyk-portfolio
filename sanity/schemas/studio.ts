import { defineField, defineType } from "sanity";

/**
 * Studio (about) page — singleton. Mirrors `studio` in lib/content.ts.
 */
export const studioSchema = defineType({
  name: "studio",
  title: "Studio Page",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "paragraphs",
      title: "Body paragraphs",
      type: "array",
      of: [{ type: "text", rows: 3 }],
    }),
    defineField({
      name: "specs",
      title: "Spec grid",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: ({ title }) => ({ title: "Studio Page", subtitle: title }),
  },
});
