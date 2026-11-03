import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { clickUntil } from "./helpers";

/**
 * Axe's automated rules catch roughly a third of WCAG problems, so a pass is a floor, not a
 * verdict (manual review lives in #11). Any violation fails the test.
 */
const PAGES = ["/about", "/work", "/talent", "/rentals", "/rentals/quote", "/contact", "/contact?type=Talent"];

async function firstLink(page: Page, listing: string, prefix: string, exclude: string[] = []) {
  await page.goto(listing);
  // The listing renders its links after the page loads; wait for one so "none" means none, not "not yet".
  await page
    .locator(`a[href^="${prefix}"]`)
    .filter({ hasNot: page.locator(`[href="${exclude[0] ?? ""}"]`) })
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => {});
  const hrefs = await page.locator(`a[href^="${prefix}"]`).evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
  return hrefs.find((href) => href.length > prefix.length && !exclude.includes(href));
}

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

test("axe: a rental item page", async ({ page }) => {
  const href = await firstLink(page, "/rentals", "/rentals/", ["/rentals/quote"]);
  test.skip(!href, "No rental items in this dataset");
  await audit(page, href!);
});

test("axe: a talent profile page", async ({ page }) => {
  const href = await firstLink(page, "/talent", "/talent/");
  test.skip(!href, "No talent in this dataset");
  await audit(page, href!);
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

  test("axe: the quote drawer", async ({ page }) => {
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
