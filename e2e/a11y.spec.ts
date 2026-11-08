import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { featuredTalent, rentalItems } from "./fixtures/data";
import { clickUntil } from "./helpers";

/**
 * Axe's automated rules catch roughly a third of WCAG problems, so a pass is a floor, not a
 * verdict (manual review lives in #11). Any violation fails the test.
 */
const PAGES = ["/about", "/work", "/talent", "/contact", "/contact?type=Talent", "/privacy"];

async function audit(page: Page, path: string, open?: (page: Page) => Promise<void>) {
  await page.goto(path);
  // Wait for the page to settle (skeletons gone, images decoded) before measuring.
  await page.waitForLoadState("networkidle");
  await open?.(page);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(
    violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `  ${n.target.join(" ")}`).join("\n")}`),
    `Accessibility violations on ${path}`,
  ).toEqual([]);
}

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await audit(page, path);
  });
}

test.describe("home", () => {
  // The live hero is a WebGL scene. On CI's software renderer it saturates the main thread and axe never
  // finishes, so audit the static hero reduced-motion visitors get (HomeHero's "static" mode).
  test.use({ reducedMotion: "reduce" });

  test("axe: /", async ({ page }) => {
    await audit(page, "/");
  });
});

// Rentals is hidden; see playwright.config.ts.
test.skip("axe: a rental item page", async ({ page }) => {
  await audit(page, `/rentals/${rentalItems.multi.slug}`);
});

test("axe: a talent profile page", async ({ page }) => {
  await audit(page, featuredTalent.path);
});

test.describe("with a dialog open", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("axe: the mobile menu", async ({ page }) => {
    await audit(page, "/about", async (page) => {
      const dialog = page.getByRole("dialog", { name: en.nav.label });
      await clickUntil(page.getByRole("button", { name: en.nav.menu }), () => expect(dialog).toBeVisible({ timeout: 1000 }));
      // Let the content's fade-in finish, so contrast is measured on the final colours.
      await page.waitForTimeout(400);
    });
  });

  test.skip("axe: the quote drawer", async ({ page }) => {
    await audit(page, "/rentals", async (page) => {
      const added = page.getByRole("button", { name: format(en.rentals.inQuote, { qty: 1 }) }).first();
      await clickUntil(page.getByRole("button", { name: en.rentals.addToQuote }).first(), () =>
        expect(added).toBeVisible({ timeout: 1000 }),
      );
      await page.getByRole("button", { name: /^Open quote basket/ }).click();
      await expect(page.getByRole("dialog", { name: en.basket.title })).toBeVisible();
      await page.waitForTimeout(600);
    });
  });
});
