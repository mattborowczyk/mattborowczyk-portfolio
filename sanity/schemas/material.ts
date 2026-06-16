import { defineField, defineType } from "sanity";

export const materialSchema = defineType({
  name: "material",
  title: "Material",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "name" },
  },
});
