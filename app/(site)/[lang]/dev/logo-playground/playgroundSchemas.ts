import { z } from "zod";

import {
  glassParamsSchema,
  interactionParamsSchema,
  lightsSchema,
  materialParamsSchema,
  meshModeSchema,
  rimLookSchema,
} from "@/features/logo";

/** Playground display: live WebGL glass vs white PNG fallback. */
export const displaySchema = z.enum(["live", "fallback"]);
export type LogoDisplayMode = z.infer<typeof displaySchema>;

/** Older snapshots may omit params; `coalesceParams` fills the gaps from the rim preset. */
export const partialGlassParamsSchema = glassParamsSchema.partial();
export type LogoPartialGlassParams = z.infer<typeof partialGlassParamsSchema>;

export const playgroundConfigSchema = z.object({
  version: z.literal(1),
  meshMode: meshModeSchema,
  rimLook: rimLookSchema,
  display: displaySchema,
  params: glassParamsSchema,
});
export type LogoPlaygroundConfig = z.infer<typeof playgroundConfigSchema>;

/** Pasted full snapshot: only the version, mesh mode and params are required. */
export const fullImportSchema = z.object({
  version: z.literal(1),
  meshMode: meshModeSchema,
  rimLook: rimLookSchema.default("light"),
  display: displaySchema.default("live"),
  params: partialGlassParamsSchema,
});

export const materialImportSchema = z.object({
  rimLook: rimLookSchema.optional(),
  meshMode: meshModeSchema.optional(),
  params: materialParamsSchema.partial(),
});

export const lightingImportSchema = z.object({
  lights: lightsSchema,
});

export const interactionImportSchema = z.object({
  params: interactionParamsSchema.partial(),
});

export const materialExportSchema = z.object({
  version: z.literal(1),
  section: z.literal("material"),
  rimLook: rimLookSchema,
  meshMode: meshModeSchema,
  params: materialParamsSchema,
});
export type LogoMaterialConfigExport = z.infer<typeof materialExportSchema>;

export const lightingExportSchema = z.object({
  version: z.literal(1),
  section: z.literal("lighting"),
  rimLook: rimLookSchema,
  lights: lightsSchema,
});
export type LogoLightingConfigExport = z.infer<typeof lightingExportSchema>;

export const interactionExportSchema = z.object({
  version: z.literal(1),
  section: z.literal("interaction"),
  rimLook: rimLookSchema,
  params: interactionParamsSchema,
});
export type LogoInteractionConfigExport = z.infer<typeof interactionExportSchema>;

/** First few issues as `path: message`, so a bad paste says which field is wrong. */
export function formatZodError(error: z.ZodError, limit = 3): string {
  const lines = error.issues.slice(0, limit).map((issue) => {
    const path = issue.path.reduce<string>(
      (acc, part) => (typeof part === "number" ? `${acc}[${part}]` : acc ? `${acc}.${String(part)}` : String(part)),
      "",
    );
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  const more = error.issues.length - limit;
  return more > 0 ? `${lines.join("; ")} (+${more} more)` : lines.join("; ");
}
