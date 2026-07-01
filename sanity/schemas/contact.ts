import { defineField, defineType } from "sanity";

/**
 * Contact page (contact details + the merged commission explainer) — singleton.
 * Mirrors `contactDetails` and `commission` in lib/content.ts.
 */
export const contactSchema = defineType({
  name: "contact",
  title: "Contact Page",
  type: "document",
  groups: [
    { name: "details", title: "Contact details", default: true },
    { name: "commission", title: "Commission" },
  ],
  fields: [
    defineField({
      name: "details",
      title: "Contact details",
      type: "array",
      group: "details",
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
            defineField({
              name: "href",
              title: "Link (optional)",
              type: "string",
              description: "mailto:, https:// or leave blank for plain text.",
            }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        },
      ],
    }),
    defineField({
      name: "commissionHeadline",
      title: "Commission headline",
      type: "string",
      group: "commission",
    }),
    defineField({
      name: "commissionIntro",
      title: "Commission intro",
      type: "text",
      rows: 3,
      group: "commission",
    }),
    defineField({
      name: "commissionSteps",
      title: "Commission steps",
      type: "array",
      group: "commission",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "no", title: "Number", type: "string" }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: "body", title: "Body", type: "text", rows: 2 }),
          ],
          preview: { select: { title: "title", subtitle: "body" } },
        },
      ],
    }),
    defineField({
      name: "commissionPricing",
      title: "Commission pricing grid",
      type: "array",
      group: "commission",
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
    prepare: () => ({ title: "Contact Page" }),
  },
});
