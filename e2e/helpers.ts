import { expect, type Locator, type Page, test } from "@playwright/test";

import { features } from "../lib/features";
import { TEST_EMAIL_DOMAIN } from "./fixtures/data";

/** Call first in a test that drives Rentals: skips it while Rentals is hidden (its pages are a 404, so there is nothing to drive). */
export function skipWithoutRentals() {
  test.skip(!features.rentals, "Rentals is switched off (features.rentals)");
}

/**
 * Waits for the fonts and every image on screen to finish loading, so axe measures contrast on the final page. An
 * image below the fold that loads lazily isn't waited for, since it never starts until it is scrolled to.
 */
export async function waitForImagesAndFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.images].every((img) => {
          const box = img.getBoundingClientRect();
          const onScreen = box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
          return img.complete || !onScreen;
        }),
      ),
    )
    .toBe(true);
}

/** Waits for every CSS transition and animation running in `locator` (and its descendants) to finish. */
export async function waitForAnimations(locator: Locator) {
  await locator.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)).then(() => undefined));
}

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
