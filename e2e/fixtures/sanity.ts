import type { SanityClient } from "@sanity/client";

import { toolingClient } from "../../scripts/lib/sanity";

/**
 * The datasets the e2e suite may create fixtures in and delete from: `dev`, or a scratch copy named `dev-…`.
 * Never production, whatever the environment says.
 */
export const isTestDataset = (dataset: string | undefined): dataset is string =>
  dataset === "dev" || !!dataset?.startsWith("dev-");

/** A write client for the dataset the run targets (the environment playwright.config.ts loaded), or an error if it shouldn't be written to. */
export function fixtureClient(): SanityClient {
  const {
    NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
    NEXT_PUBLIC_SANITY_DATASET: dataset,
    SANITY_API_WRITE_TOKEN: token,
  } = process.env;

  if (!projectId || !token)
    throw new Error("[e2e] NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN are needed to create the test content.");
  if (!isTestDataset(dataset)) {
    throw new Error(
      `[e2e] NEXT_PUBLIC_SANITY_DATASET is "${dataset}". The e2e tests only run against "dev" (or "dev-…"), because they create and delete content.`,
    );
  }
  return toolingClient({ token: "write", dataset });
}
