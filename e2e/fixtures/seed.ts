/**
 * Creates the content the e2e suite runs on (see data.ts). It runs before the site is built, because the pages read
 * their content at build time and keep it until Sanity says it changed, so content written after the build wouldn't show.
 * `playwright.config.ts` starts it as the first step of the web server command; `global-teardown.ts` removes it again.
 *
 * It first clears out anything an earlier, crashed run left behind, so it is safe to run twice.
 */
import { randomUUID } from "node:crypto";

import { cleanup } from "./cleanup";
import { FIXTURE_ASSET_LABEL, FIXTURE_PREFIX, type PhotoKey, PHOTOS } from "./data";
import { fixtureDocuments } from "./documents";
import { solidPng } from "./images";
import { fixtureClient } from "./sanity";

async function main() {
  const client = fixtureClient();
  const { dataset } = client.config();
  await cleanup(client);

  const run = randomUUID();
  const uploaded = await Promise.all(
    PHOTOS.map(async ({ key, rgb }) => {
      const asset = await client.assets.upload("image", solidPng(1200, 800, rgb, `${run}-${key}`), {
        filename: `${FIXTURE_PREFIX}${key}.png`,
        contentType: "image/png",
        label: FIXTURE_ASSET_LABEL,
      });
      return [key, asset._id] as const;
    }),
  );
  const assets = Object.fromEntries(uploaded) as Record<PhotoKey, string>;

  const docs = fixtureDocuments(assets);
  const transaction = client.transaction();
  for (const doc of docs) transaction.createOrReplace(doc);
  await transaction.commit();

  console.log(`[e2e] Created ${docs.length} fixture document(s) and ${uploaded.length} image(s) in "${dataset}".`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
