import { cleanup } from "./fixtures/cleanup";
import { fixtureClient } from "./fixtures/sanity";

/**
 * Removes what the run created: the fixture content (see fixtures/data.ts) and the quote requests and contact
 * messages the tests submitted. It does nothing unless the run targeted a test dataset, which the fixtures never
 * would have been written to otherwise. The Sanity settings come from the environment playwright.config.ts loaded.
 */
export default async function globalTeardown() {
  try {
    await cleanup(fixtureClient());
  } catch (error) {
    // Never fail the run over cleanup; the next run's seeding clears whatever is left.
    console.warn(`[e2e] Skipped cleanup: ${error instanceof Error ? error.message : String(error)}`);
  }
}
