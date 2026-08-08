import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
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
