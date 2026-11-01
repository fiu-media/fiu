import "server-only";
import { makeSafeQueryRunner } from "groqd";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

/** Server-only client for form submissions; the Editor token never reaches the browser. */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_API_WRITE_TOKEN,
});

/** Runs a groqd query with the write client, uncached, and validates the response. */
export const runQuery = makeSafeQueryRunner((query, { parameters }) => writeClient.fetch(query, parameters ?? {}));
