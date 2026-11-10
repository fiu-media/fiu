import "server-only";

import { createClient } from "next-sanity";

import { env } from "@/env";
import { omitUndefined } from "@/lib/omitUndefined";

import { apiVersion, dataset, projectId } from "../env";

/** Server-only client for form submissions; the Editor token never reaches the browser. */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  ...omitUndefined({ token: env.SANITY_API_WRITE_TOKEN }),
});
