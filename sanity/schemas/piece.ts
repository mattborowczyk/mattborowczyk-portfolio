import { defineField, defineType } from "sanity";

export const pieceSchema = defineType({
  name: "piece",
  title: "Piece",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).error("At least one image required"),
    }),
    defineField({
      name: "collection",
      title: "Collection",
      type: "reference",
      to: [{ type: "collection" }],
    }),
    defineField({
      name: "materials",
      title: "Materials",
      type: "array",
      of: [{ type: "reference", to: [{ type: "material" }] }],
    }),
    defineField({
      name: "dimensions",
      title: "Dimensions",
      type: "string",
      description: "e.g. 18mm × 12mm",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Portfolio (not for sale)", value: "portfolio" },
          { title: "For Sale", value: "for_sale" },
          { title: "Sold", value: "sold" },
          { title: "Commission Only", value: "commission" },
        ],
        layout: "radio",
      },
      initialValue: "portfolio",
    }),
    defineField({
      name: "featured",
      title: "Featured on homepage",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
    // ── Future Shopify integration ──────────────────────────────
    defineField({
      name: "shopifyProductId",
      title: "Shopify Product ID",
      type: "string",
      description:
        "Leave blank — fill in when you launch the shop. Format: gid://shopify/Product/123456",
      group: "shopify",
    }),
  ],
  groups: [
    { name: "shopify", title: "Shopify (future)" },
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "collection.title",
      media: "images.0",
    },
  },
});
