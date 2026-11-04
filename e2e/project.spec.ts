import { expect, test } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";

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

  test("a still opens in a lightbox that steps with the arrow keys and closes with Escape", async ({ page }) => {
    await page.goto("/work");
    const link = page.getByRole("link", { name: new RegExp(`^${work.view}: `) }).first();
    await expect(link.or(page.getByText(work.emptyAll))).toBeVisible();
    test.skip((await link.count()) === 0, "No projects in this dataset");
    await link.click();
    await expect(page).toHaveURL(/\/work\/[^/]+$/);

    const stills = page.getByRole("button", { name: /^View still \d+ of \d+$/ });
    await expect(stills.first()).toBeAttached();
    test.skip((await stills.count()) < 2, "This project has fewer than two stills");
    const total = await stills.count();

    await stills.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(format(work.stillCounter, { n: 1, total }))).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText(format(work.stillCounter, { n: 2, total }))).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    // Wraps to the last still.
    await expect(dialog.getByText(format(work.stillCounter, { n: total, total }))).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(stills.first()).toBeFocused();
  });

  test("an unknown project shows the not-found page", async ({ page }) => {
    // The project streams in behind Suspense, so the status is already 200 by the time it turns out to be missing.
    await page.goto("/work/no-such-project");
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});
