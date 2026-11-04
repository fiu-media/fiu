import { expect, test } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";

const { work } = en;

test.describe("project page", () => {
  test('"View project" on Our Work opens that project, and "All work" goes back', async ({ page }) => {
    await page.goto("/work");
    const link = page.getByRole("link", { name: new RegExp(`^${work.view}: `) }).first();
    // The slides stream in behind a placeholder; wait for them, or for the empty message.
    await expect(link.or(page.getByText(work.emptyAll))).toBeVisible();
    test.skip((await link.count()) === 0, "No projects in this dataset");

    const title = (await link.getAttribute("aria-label"))!.slice(work.view.length + 2);
    await link.click();
    await expect(page).toHaveURL(/\/work\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await page.getByRole("link", { name: work.back }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("an unknown project shows the not-found page", async ({ page }) => {
    // The project streams in behind Suspense, so the status is already 200 by the time it turns out to be missing.
    await page.goto("/work/no-such-project");
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});
