import { expect, type Locator, test } from "@playwright/test";

import { features } from "../lib/features";
import { TEST_EMAIL_DOMAIN } from "./fixtures/data";

/** `test` while Rentals is on, `test.skip` while it is hidden (its pages are a 404, so there is nothing to drive). */
// `test.skip` is meant to be passed around like this.
// eslint-disable-next-line @typescript-eslint/unbound-method
export const rentalsTest = features.rentals ? test : test.skip;

/** Where an element is on screen. Throws if it has no box (hidden or detached), which a test can't use anyway. */
export async function boundingBoxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("The element has no box on screen");
  return box;
}

export const testEmail = () => `e2e-${crypto.randomUUID().slice(0, 8)}@${TEST_EMAIL_DOMAIN}`;

/** `YYYY-MM-DD`, `days` from now. The quote form rejects start dates in the past, so tests ask for the future. */
export function isoDateFromNow(days: number) {
  const date = new Date(Date.now() + days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

/**
 * Click, retrying until `check` holds. A click that lands before React hydrates does nothing, and
 * there is no DOM signal for "hydrated", so retry the click rather than sleep.
 */
export async function clickUntil(target: Locator, check: () => Promise<void>) {
  await expect(async () => {
    await target.click();
    await check();
  }).toPass({ intervals: [250, 500, 1000] });
}
