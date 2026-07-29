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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "commissionIntro",
      title: "Commission intro",
      type: "text",
      rows: 3,
      group: "commission",
      validation: (Rule) => Rule.required(),
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
          ],
          preview: { select: { title: "title", subtitle: "body" } },
        },
      ],
    }),
    defineField({
      name: "commissionPricingTabs",
      title: "Commission pricing tabs",
      description:
        "One tab per commission type (e.g. 3D Commission, Full Commission). Each tab renders its own label/value grid.",
      type: "array",
      group: "commission",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "key",
              title: "Key",
              type: "slug",
              description: "Stable id for the tab — used for state, not shown.",
              options: { source: "label", maxLength: 32 },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "label",
              title: "Tab label",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "items",
              title: "Pricing grid",
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
              validation: (Rule) => Rule.min(1),
            }),
          ],
          preview: {
            select: { title: "label", items: "items" },
            prepare: ({ title, items }) => ({
              title,
              subtitle: `${items?.length ?? 0} rows`,
            }),
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Contact Page" }),
  },
});
