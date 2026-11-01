import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Axe's automated rules catch roughly a third of WCAG problems, so a pass is a floor, not a
 * verdict (manual review lives in #11). Any violation fails the test.
 */
const PAGES = ["/", "/about", "/work", "/talent", "/rentals", "/rentals/quote", "/contact"];

async function firstLink(page: Page, listing: string, prefix: string, exclude: string[] = []) {
  await page.goto(listing);
  const hrefs = await page.locator(`a[href^="${prefix}"]`).evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
  return hrefs.find((href) => href.length > prefix.length && !exclude.includes(href));
}

async function audit(page: Page, path: string) {
  await page.goto(path);
  // Wait for the page to settle (skeletons gone, images decoded) before measuring.
  await page.waitForLoadState("networkidle");
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
