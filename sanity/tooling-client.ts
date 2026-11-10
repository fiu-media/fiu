import { type ClientPerspective, createClient, type SanityClient } from "@sanity/client";

import { omitUndefined } from "@/lib/omitUndefined";

import { apiVersion } from "./studio-env";

/** A required environment variable, or an error that says where to set it. */
export function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} (set it in .env.local)`);
  return value;
}

const tokenNames = { read: "SANITY_API_READ_TOKEN", write: "SANITY_API_WRITE_TOKEN" } as const;

/**
 * The Sanity client for scripts and test fixtures. It reads the project from the environment (the same variables the
 * site uses), and uses the site's API version. Pass `token` to authenticate, `dataset` to target something other than
 * the dataset in the environment. Reads unpublished documents too (`raw`) unless `perspective` says otherwise.
 */
export function toolingClient({
  token,
  dataset,
  perspective = "raw",
}: { token?: keyof typeof tokenNames; dataset?: string; perspective?: ClientPerspective } = {}): SanityClient {
  return createClient({
    projectId: env("NEXT_PUBLIC_SANITY_PROJECT_ID"),
    dataset: dataset ?? env("NEXT_PUBLIC_SANITY_DATASET"),
    ...omitUndefined({ token: token && env(tokenNames[token]) }),
    apiVersion,
    useCdn: false,
    perspective,
  });
}
