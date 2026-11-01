import { createGroqBuilder, z } from "groqd";
import type { AllSanitySchemaTypes, internalGroqTypeReferenceTo, SanityImageAssetReference } from "@/sanity.types";

// groqd bundles its own zod (v3), so validators for query results come from here, never from our `zod`.
export { z };

/** The query builder, typed by the schema types TypeGen generates. */
export const q = createGroqBuilder<{
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
}>();

const assetReference = z.object({ _type: z.literal("reference"), _ref: z.string(), _weak: z.boolean().optional() });

/** An image's `asset` reference. Null when the editor hasn't picked a file yet. */
export const imageAsset = (input: unknown): SanityImageAssetReference | null => (input == null ? null : (assetReference.parse(input) as SanityImageAssetReference));

export const imageCrop = z
  .object({ _type: z.literal("sanity.imageCrop"), top: z.number(), bottom: z.number(), left: z.number(), right: z.number() })
  .nullable();

export const imageHotspot = z
  .object({ _type: z.literal("sanity.imageHotspot"), x: z.number(), y: z.number(), height: z.number(), width: z.number() })
  .nullable();

export const imageDimensions = z
  .object({ _type: z.literal("sanity.imageDimensions"), height: z.number(), width: z.number(), aspectRatio: z.number() })
  .nullable();

/** Portable Text (the manifesto and bios) are rendered from the stored blocks as they are. */
export const portableText = z.array(z.object({ _type: z.string(), _key: z.string() }).passthrough()).nullable();
