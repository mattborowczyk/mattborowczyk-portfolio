import { defineField, defineType } from "sanity";

/**
 * Newsletter card copy — singleton. The subscribe endpoint is fixed
 * (/api/newsletter → MailerLite); only the copy is editable here.
 */
export const newsletterSchema = defineType({
  name: "newsletter",
  title: "Newsletter",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "microcopy",
      title: "Microcopy",
      type: "string",
      description: 'e.g. "Studio releases & process notes. Sent rarely."',
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: ({ title }) => ({ title: "Newsletter", subtitle: title }),
  },
});
