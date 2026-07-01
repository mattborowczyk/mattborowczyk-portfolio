import type { StructureResolver } from "sanity/structure";

/**
 * Singleton document types. Each is edited as a single fixed-id document
 * (no list, no create/duplicate/delete — enforced here + in sanity.config.ts).
 */
export const singletonTypes = new Set([
  "studio",
  "contact",
  "links",
  "newsletter",
  "settings",
]);

/** A singleton list item that opens its one fixed document directly. */
function singleton(
  S: Parameters<StructureResolver>[0],
  id: string,
  title: string,
) {
  return S.listItem()
    .title(title)
    .id(id)
    .child(S.document().schemaType(id).documentId(id).title(title));
}

/**
 * Desk structure:
 * - Repeatable content (Products, Courses) as ordered document lists.
 * - Pages & globals as singletons.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Products")
        .schemaType("product")
        .child(
          S.documentTypeList("product")
            .title("Products")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),

      S.listItem()
        .title("Courses")
        .schemaType("course")
        .child(
          S.documentTypeList("course")
            .title("Courses")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),

      S.divider(),

      singleton(S, "studio", "Studio Page"),
      singleton(S, "contact", "Contact Page"),
      singleton(S, "links", "Links Page"),
      singleton(S, "newsletter", "Newsletter"),

      S.divider(),

      singleton(S, "settings", "Site Settings"),
    ]);
