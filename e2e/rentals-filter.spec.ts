import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { clickUntil } from "./helpers";

const { rentals } = en;

/** The category pills after "All"; empty when the dataset has no categories with kit in them. */
async function categoryPills(page: Page) {
  const pills = page.getByRole("group", { name: rentals.filterLabel }).getByRole("button");
  await expect(pills.first()).toBeVisible();
  return pills.filter({ hasNotText: new RegExp(`^${rentals.allCategories}$`) });
}

const all = (page: Page) => page.getByRole("button", { name: rentals.allCategories, exact: true });

test("the rentals category filter lives in the URL", async ({ page }) => {
  await page.goto("/rentals");
  const pills = await categoryPills(page);
  test.skip((await pills.count()) === 0, "No rental categories in this dataset");

  const first = pills.first();
  await clickUntil(first, () => expect(page).toHaveURL(/\?category=[^&]+$/));
  await expect(first).toHaveAttribute("aria-pressed", "true");
  const filtered = page.url();

  await page.goBack();
  await expect(page).not.toHaveURL(/category=/);
  await expect(all(page)).toHaveAttribute("aria-pressed", "true");

  await page.goForward();
  await expect(page).toHaveURL(filtered);
  await expect(first).toHaveAttribute("aria-pressed", "true");
});

test("/rentals?category= opens filtered, and an unknown category shows everything", async ({ page }) => {
  await page.goto("/rentals");
  const pills = await categoryPills(page);
  test.skip((await pills.count()) === 0, "No rental categories in this dataset");
  const first = pills.first();
  await clickUntil(first, () => expect(page).toHaveURL(/\?category=[^&]+$/));
  const filtered = page.url();

  await page.goto(filtered);
  await expect(pills.first()).toHaveAttribute("aria-pressed", "true");
  await expect(all(page)).toHaveAttribute("aria-pressed", "false");

  await page.goto("/rentals?category=not-a-category");
  await expect(all(page)).toHaveAttribute("aria-pressed", "true");
});
