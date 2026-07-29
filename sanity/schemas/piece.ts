import { defineField, defineType } from "sanity";

import { pieceStatuses } from "@/lib/pieces";

/**
 * Portfolio piece — a record of work made, for the /portfolio run. Mirrors the
 * `Piece` interface in lib/pieces.ts. Kept separate from `product` because a
 * piece needs no price and may never go on sale; when it does, point `product`
 * at the catalogue entry and the card links through to it.
 */
export const pieceSchema = defineType({
  name: "piece",
  title: "Portfolio Piece",
  type: "document",
  fields: [
    defineField({
      name: "ref",
      title: "Reference",
      type: "string",
      description: "Short code shown under the placeholder — e.g. PC-01",
      validation: (Rule) =>
        Rule.required().uppercase().custom(async (ref, context) => {
          if (!ref) return true;
          const { document, getClient } = context;
          const id = document?._id.replace(/^drafts\./, "");
          const params = { ref, draft: `drafts.${id}`, published: id };
          const query =
            '!defined(*[_type == "piece" && ref == $ref && !(_id in [$draft, $published])][0]._id)';
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
      description: 'e.g. "Signet Ring", "Grillz", "Pendant"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "material",
      title: "Material",
      type: "string",
      description: 'Free text — e.g. "Silver 925", "18k Gold · Ruby"',
    }),
    defineField({
      name: "completed",
      title: "Completed",
      type: "date",
      options: { dateFormat: "YYYY-MM" },
      description:
        "Newest first — this is what orders the portfolio run. Only the year is shown.",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      description:
        "Shown beside the name. Use Private commission for client work that was never for sale.",
      initialValue: "Archive",
      options: { list: pieceStatuses, layout: "radio" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "product",
      title: "Catalogue entry",
      type: "reference",
      to: [{ type: "product" }],
      description:
        "Optional. Set this if the piece is also for sale — the card then links to its product page.",
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
        "First image is the one shown in the run; the second is revealed on hover.",
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
  ],
  orderings: [
    {
      title: "Newest first",
      name: "completedDesc",
      by: [{ field: "completed", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      ref: "ref",
      status: "status",
      media: "images.0",
    },
    prepare: ({ title, ref, status, media }) => ({
      title,
      subtitle: [ref, status].filter(Boolean).join(" · "),
      media,
    }),
  },
});
