import { createClient } from "@sanity/client";
import { TEST_EMAIL_DOMAIN } from "./helpers";

/**
 * Deletes the quote requests and contact messages the e2e run created. They are found by their
 * reserved test address, and nothing is touched unless the run targeted the `dev` dataset. The
 * Sanity settings come from the environment that playwright.config.ts loaded.
 */
export default async function globalTeardown() {
  const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset, SANITY_API_WRITE_TOKEN: token } = process.env;

  if (dataset !== "dev") {
    console.warn(`[e2e] NEXT_PUBLIC_SANITY_DATASET is "${dataset}", not "dev"; skipping cleanup. Remove *@${TEST_EMAIL_DOMAIN} submissions by hand if there are any.`);
    return;
  }
  if (!projectId || !token) {
    console.warn("[e2e] Sanity project id or write token missing; skipping cleanup.");
    return;
  }

  const client = createClient({ projectId, dataset, token, apiVersion: "2026-10-01", useCdn: false, perspective: "raw" });
  // GROQ's `match` tokenises text, so it can't test "ends with"; the inbox on dev is small, so filter here.
  const inbox = await client.fetch<{ _id: string; email?: string }[]>(`*[_type in ["quoteRequest", "contactMessage"]]{ _id, email }`);
  const leftovers = inbox.filter((doc) => doc.email?.endsWith(`@${TEST_EMAIL_DOMAIN}`));
  if (leftovers.length === 0) return;

  const transaction = client.transaction();
  for (const { _id } of leftovers) transaction.delete(_id);
  await transaction.commit();
  console.log(`[e2e] Deleted ${leftovers.length} test submission(s) from "${dataset}".`);
}
