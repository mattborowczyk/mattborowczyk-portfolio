import { defineField, defineType } from "sanity";

/**
 * Catalogue piece. Mirrors the `Product` interface in lib/products.ts so the
 * site can fall back to the local seed when Sanity is empty/unconfigured.
 * `ref` doubles as the URL slug (e.g. "SR-01"). `images` are authored here for
 * future use; the live site still renders sage placeholders until real stills
 * land (first image = primary, the rest = additional views).
 */
export const productSchema = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "ref",
      title: "Reference",
      type: "string",
      description: "Unique code, used as the URL slug — e.g. SR-01",
      validation: (Rule) =>
        Rule.required().uppercase().custom(async (ref, context) => {
          if (!ref) return true;
          const { document, getClient } = context;
          const id = document?._id.replace(/^drafts\./, "");
          const params = { ref, draft: `drafts.${id}`, published: id };
          const query =
            '!defined(*[_type == "product" && ref == $ref && !(_id in [$draft, $published])][0]._id)';
          const isUnique = await getClient({ apiVersion: "2024-01-01" }).fetch(
            query,
            params,
          );
          return isUnique || "Reference must be unique";
        }),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      description: 'e.g. "Signet Ring"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: ["Rings", "Objects", "Hardware", "Tableware"],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "material",
      title: "Material",
      type: "string",
      options: {
        list: ["Silver", "Gold"],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "finish",
      title: "Finish",
      type: "string",
      description: 'e.g. "Hand-polished"',
    }),
    defineField({
      name: "weight",
      title: "Weight",
      type: "string",
      description: 'e.g. "6 g"',
    }),
    defineField({
      name: "dimensions",
      title: "Dimensions",
      type: "string",
      description: 'e.g. "19 mm"',
    }),
    defineField({
      name: "leadTime",
      title: "Lead time",
      type: "string",
      description: 'e.g. "3–4 weeks"',
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "Include the currency symbol — e.g. £420",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      description:
        "First image is the primary render; the rest are additional views.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first in the catalogue run.",
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
    select: { title: "name", subtitle: "ref", media: "images.0" },
  },
});
