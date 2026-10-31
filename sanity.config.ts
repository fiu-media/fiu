"use client";

import { documentInternationalization } from "@sanity/document-internationalization";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { languages, translatedTypes } from "./sanity/languages";
import { resolve } from "./sanity/presentation/resolve";
import { FiuIcon } from "./sanity/FiuIcon";
import { schemaTypes } from "./sanity/schemaTypes";
import { hiddenTemplates, singletonActions, structure } from "./sanity/structure";

export default defineConfig({
  name: "default",
  title: "Fiú Media",
  icon: FiuIcon,
  basePath: "/studio",
  projectId,
  dataset,
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
      resolve,
      previewUrl: { draftMode: { enable: "/api/draft-mode/enable" } },
    }),
    documentInternationalization({
      supportedLanguages: languages,
      schemaTypes: translatedTypes,
      languageField: "language",
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
