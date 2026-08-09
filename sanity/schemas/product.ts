import { defineField, defineType } from "sanity";

import { formats, materials } from "@/lib/products";
import { ALL_PIECES, categories } from "@/lib/site";

/** "All pieces" is the rail's reset entry, not something a piece can be. */
const filterCategories = categories.filter((c) => c !== ALL_PIECES);

/**
 * A piece in the portfolio run. Mirrors the `Product` interface in
 * lib/products.ts so the site can fall back to the local seed when Sanity is
 * empty/unconfigured. `ref` doubles as the URL slug (e.g. "SR-01").
 *
 * `made` — not `_createdAt` — orders the run, so the date the piece was
 * actually finished governs, independent of when it was entered here.
 *
 * Price, details, weight, dimensions and lead time are all optional: each is
 * hidden from the piece when blank, so work can go up before those are settled.
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
      name: "made",
      title: "Date made",
      type: "date",
      description:
        "When the piece was finished — this is what orders the run (newest first). Set it yourself; it is not the date the entry was created.",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      // The radio list is the static fallback from lib/site.ts: `options.list`
      // is baked in when the schema is defined, so it cannot read the live
      // taxonomy out of Site Settings. The rule below closes the gap from the
      // other side — it queries the settings document and rejects a category
      // the rail no longer offers, so renaming or dropping one surfaces as a
      // validation error on the affected pieces instead of quietly stranding
      // them behind a filter that no longer exists. Adding a category still
      // means adding it in both places; see the note in README.
      options: { list: [...filterCategories], layout: "radio" },
      validation: (Rule) =>
        Rule.required().custom(async (category, context) => {
          if (!category) return true;

          let live: string[] | null = null;
          try {
            live = await context
              .getClient({ apiVersion: "2024-01-01" })
              .fetch<string[] | null>('*[_id == "settings"][0].categories');
          } catch (error) {
            // This rule is a cross-check, not a gate: if the settings document
            // can't be read the honest answer is "unknown", and blocking every
            // product edit until Sanity is reachable again would be a worse
            // failure than letting a category through unverified. Same instinct
            // as `withFallback` on the site side — a CMS hiccup degrades, it
            // doesn't stop the work. (The `ref` uniqueness rule above is
            // deliberately not written this way: failing open there would admit
            // a duplicate slug, which is the thing it exists to prevent.)
            console.warn("[sanity] category validation skipped:", error);
            return true;
          }

          // No settings document, or no taxonomy set on it, means the site is
          // running on the seed list — which is exactly what the radio offers.
          if (!live?.length) return true;
          return (
            live.includes(category) ||
            `"${category}" is not in the portfolio categories set in Site Settings (${live.join(", ")}), so no filter will show this piece`
          );
        }),
    }),
    defineField({
      name: "format",
      title: "Digital or physical",
      type: "string",
      description:
        "Whether the piece is a delivered file or a made object. Nothing filters on this yet — it is here so the archive can be split into digital / physical / all later. Leave blank if it doesn't apply.",
      options: {
        // Spread from lib/products.ts, same as `material`, so the seed union
        // and this list can't drift.
        list: [...formats],
        layout: "radio",
      },
      // Deliberately not required: every piece already in the dataset predates
      // this field, and requiring it would put all of them into a validation
      // error state on first open for a field nothing reads yet.
    }),
    defineField({
      name: "material",
      title: "Material",
      type: "string",
      options: {
        // Sourced from lib/products.ts so the seed's `Material` union and this
        // list can never drift.
        list: [...materials],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "details",
      title: "Details",
      type: "text",
      rows: 2,
      description:
        'Finish, stones, engraving — anything worth naming. e.g. "Hand-polished · ruby cabochon". Hidden from the piece when blank.',
    }),
    defineField({
      name: "weight",
      title: "Weight",
      type: "string",
      description: 'e.g. "6 g" — hidden when blank.',
    }),
    defineField({
      name: "dimensions",
      title: "Dimensions",
      type: "string",
      description: 'e.g. "19 mm" — hidden when blank.',
    }),
    defineField({
      name: "leadTime",
      title: "Lead time",
      type: "string",
      description: 'e.g. "3–4 weeks" — hidden when blank.',
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description:
        "Include the currency symbol — e.g. £420. Leave blank to hide the price entirely.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "media",
      title: "Media",
      type: "array",
      description:
        "First item is the one shown in the run; the second is revealed on hover. Stills, animated GIFs and short clips (MP4 / WebM) are all fine — GIFs and video are served untouched so they keep moving.",
      of: [
        {
          type: "image",
          title: "Image or GIF",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
          ],
        },
        {
          type: "file",
          title: "Video clip",
          options: { accept: "video/*" },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
          ],
        },
      ],
    }),
  ],
  orderings: [
    {
      title: "Newest made first",
      name: "madeDesc",
      by: [{ field: "made", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "name", ref: "ref", made: "made", media: "media.0" },
    prepare: ({ title, ref, made, media }) => ({
      title,
      subtitle: [ref, made].filter(Boolean).join(" · "),
      media,
    }),
  },
});
