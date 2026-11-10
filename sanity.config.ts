import { documentInternationalization } from "@sanity/document-internationalization";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";

import { omitUndefined } from "./lib/omitUndefined";
import { schemaTypes } from "./sanity/schema";
import { FiuIcon } from "./sanity/studio/FiuIcon";
import { languages, translatedTypes } from "./sanity/studio/languages";
import { resolve } from "./sanity/studio/presentation/resolve";
import { hiddenTemplates, singletonActions, structure } from "./sanity/studio/structure";
import { apiVersion, dataset, previewOrigin, projectId } from "./sanity/studio-env";

export default defineConfig({
  name: "default",
  title: "Fiú Media",
  icon: FiuIcon,
  projectId,
  dataset,
  auth: {
    // Signing in with Vercel goes through the integration's SSO, which ends on sanity.io instead of returning to the Studio.
    providers: (prev) => prev.filter((p) => p.name !== "vercel" && !p.url.includes("/login/vercel")),
  },
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ id }) => !hiddenTemplates.includes(id)),
  },
  document: {
    actions: (prev, { schemaType }) => singletonActions(prev as { action?: string }[], schemaType) as typeof prev,
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      ...omitUndefined({ resolve }),
      previewUrl: { origin: previewOrigin, previewMode: { enable: "/api/draft-mode/enable" } },
    }),
    documentInternationalization({
      supportedLanguages: languages,
      schemaTypes: translatedTypes,
      languageField: "language",
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
