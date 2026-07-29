import { productSchema } from "./product";
import { pieceSchema } from "./piece";
import { courseSchema } from "./course";
import { studioSchema } from "./studio";
import { contactSchema } from "./contact";
import { linksSchema } from "./links";
import { newsletterSchema } from "./newsletter";
import { settingsSchema } from "./settings";

export const schemaTypes = [
  // Repeatable content
  productSchema,
  pieceSchema,
  courseSchema,
  // Singletons
  studioSchema,
  contactSchema,
  linksSchema,
  newsletterSchema,
  settingsSchema,
];
