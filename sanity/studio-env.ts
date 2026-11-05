/**
 * Configuration the Studio reads. It is built by Sanity's own tooling, which only puts `SANITY_STUDIO_*`
 * variables into the bundle, so this can't use `@/env`. The `NEXT_PUBLIC_*` fallbacks are for the Node-side
 * tooling (schema extract, typegen), where Next's variables are the ones set.
 */
export const apiVersion = "2026-10-01";

export const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/** Where the hosted Studio lives. Deep links (emails, click-to-edit overlays) point here. */
export const studioUrl = "https://fiu.sanity.studio";

/** The site the Presentation tool previews. Override with `SANITY_STUDIO_PREVIEW_ORIGIN` to preview a local server. */
export const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN ?? "https://xn--fi-ska.ie";
