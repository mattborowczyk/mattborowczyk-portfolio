import { defineField, defineType } from "sanity";

/**
 * Hidden bio-link hub (/links) — singleton. Mirrors `linkItems` in
 * lib/content.ts. Each item renders as an internal route, an external link, or
 * the newsletter opener depending on `actionType`.
 */
export const linksSchema = defineType({
  name: "links",
  title: "Links Page",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Links",
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
              name: "actionType",
              title: "Action",
              type: "string",
              options: {
                list: [
                  { title: "Internal route", value: "internal" },
                  { title: "External link", value: "external" },
                  { title: "Open newsletter", value: "newsletter" },
                ],
                layout: "radio",
              },
              initialValue: "internal",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "href",
              title: "Href",
              type: "string",
              description:
                "Path (/contact) for internal, full URL for external. Ignored for the newsletter action.",
              hidden: ({ parent }) => parent?.actionType === "newsletter",
              validation: (Rule) =>
                Rule.custom((href, context) => {
                  const type = (context.parent as { actionType?: string })
                    ?.actionType;
                  if (type !== "newsletter" && !href) return "Href is required";
                  return true;
                }),
            }),
          ],
          preview: { select: { title: "label", subtitle: "actionType" } },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Links Page" }),
  },
});
