import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "@/sanity/schemas";
import { structure, singletonTypes } from "@/sanity/structure";
import { dataset, isSanityConfigured, projectId } from "@/sanity/lib/client";

if (!isSanityConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    "[sanity] NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET are not set — " +
      "the Studio at /admin will not connect. See .env.local.example.",
  );
}

// Actions a singleton may keep — no create/duplicate/delete.
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Mateusz Borowczyk — Jewellery",

  // Embedded Studio lives at /admin (the public Studio page owns /studio).
  basePath: "/admin",

  projectId,
  dataset,

  plugins: [
    structureTool({ structure }),
    // Draft preview: the site in an iframe beside the editor, rendering
    // unpublished edits. `initial` is left unset so it defaults to
    // `location.origin` — the Studio is embedded at /admin, so the site being
    // previewed is always the same deployment, and there is no preview URL to
    // keep in sync between local, deploy previews and production.
    //
    // `enable` is the only route Presentation needs: it mints a one-time secret
    // and hands it to us to validate. That validation is what requires
    // SANITY_API_TOKEN — without it Presentation loads but the frame stays on
    // published content. `disable` is not wired here because Sanity has not
    // implemented it; the site's own draft banner owns that.
    presentationTool({
      previewUrl: { previewMode: { enable: "/api/draft/enable" } },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Hide singletons from the global "Create new document" menu.
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  document: {
    // Restrict the action set for singleton documents.
    actions: (input, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,
  },
});
