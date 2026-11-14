import type { SanityClient } from "@sanity/client";

import { FIXTURE_ASSET_LABEL, FIXTURE_PREFIX, TEST_EMAIL_DOMAIN } from "./data";

/**
 * Removes everything the e2e suite creates, and only that:
 *  - the fixture documents (ids starting with `e2e-`, published or draft),
 *  - the quote requests and contact messages the tests submitted (they use a reserved `@example.test` address),
 *  - the image assets the fixtures uploaded (found by their label, and deleted after the documents that used them).
 *
 * Safe to run at any time, and run before seeding too, so a crashed run's leftovers never pile up.
 */
export async function cleanup(client: SanityClient) {
  const { dataset } = client.config();

  const fixtureIds = await client.fetch<string[]>(
    `*[string::startsWith(_id, $prefix) || string::startsWith(_id, "drafts." + $prefix)]._id`,
    { prefix: FIXTURE_PREFIX },
  );
  // GROQ's `match` tokenises text, so it can't test "ends with"; the inbox on a test dataset is small, so filter here.
  const inbox = await client.fetch<{ _id: string; email?: string }[]>(
    `*[_type in ["quoteRequest", "contactMessage"]]{ _id, email }`,
  );
  const submissionIds = inbox.filter((doc) => doc.email?.endsWith(`@${TEST_EMAIL_DOMAIN}`)).map((doc) => doc._id);

  const docIds = [...fixtureIds, ...submissionIds];
  if (docIds.length > 0) {
    const transaction = client.transaction();
    for (const id of docIds) transaction.delete(id);
    await transaction.commit();
  }

  const assetIds = await client.fetch<string[]>(`*[_type == "sanity.imageAsset" && label == $label]._id`, {
    label: FIXTURE_ASSET_LABEL,
  });
  let assetsRemoved = 0;
  for (const id of assetIds) {
    try {
      await client.delete(id);
      assetsRemoved++;
    } catch (error) {
      // Still referenced by something that isn't ours. Leave it rather than break that document.
      console.warn(`[e2e] Kept asset ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (docIds.length + assetsRemoved > 0) {
    console.log(
      `[e2e] Removed ${fixtureIds.length} fixture document(s), ${submissionIds.length} test submission(s) and ${assetsRemoved} image(s) from "${dataset}".`,
    );
  }
}
