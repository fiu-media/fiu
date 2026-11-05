import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { project } from "./fixtures/data";

const { work } = en;

/** The fixture project's card on Our Work. */
const viewProject = (page: Page) => page.getByRole("link", { name: `${work.view}: ${project.title}`, exact: true });

test.describe("project page", () => {
  test('"View project" on Our Work opens that project, and "All work" goes back', async ({ page }) => {
    await page.goto("/work");
    // The slides stream in behind a placeholder.
    const link = viewProject(page);
    await expect(link).toBeVisible();

    await link.click();
    await expect(page).toHaveURL(new RegExp(`/work/${project.slug}$`));
    await expect(page.getByRole("heading", { level: 1, name: project.title })).toBeVisible();

    await page.getByRole("link", { name: work.back }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("a still opens in a lightbox that steps with the arrow keys and closes with Escape", async ({ page }) => {
    await page.goto(`/work/${project.slug}`);

    const stills = page.getByRole("button", { name: /^View still \d+ of \d+$/ });
    const total = project.stills.length;
    await expect(stills).toHaveCount(total);

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
