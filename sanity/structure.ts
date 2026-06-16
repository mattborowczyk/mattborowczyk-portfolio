import type { StructureResolver } from "sanity/structure";

/**
 * Custom desk structure:
 * - Settings is a singleton (no list view, goes straight to the document)
 * - Everything else is grouped logically
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // Singleton: Site Settings
      S.listItem()
        .title("Site Settings")
        .id("settings")
        .child(
          S.document()
            .schemaType("settings")
            .documentId("siteSettings")
        ),

      S.divider(),

      // Portfolio
      S.listItem()
        .title("Pieces")
        .schemaType("piece")
        .child(S.documentTypeList("piece").title("Pieces")),

      S.listItem()
        .title("Collections")
        .schemaType("collection")
        .child(S.documentTypeList("collection").title("Collections")),

      S.listItem()
        .title("Materials")
        .schemaType("material")
        .child(S.documentTypeList("material").title("Materials")),

      S.divider(),

      // Pages
      S.listItem()
        .title("Pages")
        .schemaType("page")
        .child(S.documentTypeList("page").title("Pages")),
    ]);
