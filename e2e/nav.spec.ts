import { expect, test } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { clickUntil } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test("the mobile menu dialog closes on Escape and returns focus to its button", async ({ page }) => {
  await page.goto("/about");
  const menu = page.getByRole("button", { name: en.nav.menu });
  const dialog = page.getByRole("dialog", { name: en.nav.label });

  await clickUntil(menu, () => expect(dialog).toBeVisible({ timeout: 1000 }));
  await expect(dialog.getByRole("link", { name: en.nav.contact })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();
});

test("choosing a link closes the menu and navigates", async ({ page }) => {
  await page.goto("/about");
  const dialog = page.getByRole("dialog", { name: en.nav.label });
  await clickUntil(page.getByRole("button", { name: en.nav.menu }), () => expect(dialog).toBeVisible({ timeout: 1000 }));

  await dialog.getByRole("link", { name: en.nav.contact }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(dialog).toBeHidden();
});

// Home runs its live WebGL logo unless motion is reduced. On a CI runner that is software-rendered, and it
// starves the page's main thread, so the click on the menu link can stall past the test timeout. The scroll lock
// has nothing to do with the scene, so this test runs against the static hero.
test.describe("on Home", () => {
  test.use({ reducedMotion: "reduce" });

  test("leaving Home releases its mobile scroll lock", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-home-lock", "");

    await page.getByRole("button", { name: en.nav.menu }).first().click();
    await page.getByRole("dialog", { name: en.nav.label }).getByRole("link", { name: en.nav.contact }).click();
    await expect(page).toHaveURL(/\/contact$/);

    await expect(html).not.toHaveAttribute("data-home-lock", "");
    expect(await html.evaluate((el) => getComputedStyle(el).touchAction)).not.toBe("none");
  });
});
