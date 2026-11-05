import { expect, test } from "@playwright/test";
import { localeNames } from "../lib/i18n/config";

const at = (pathname: string) => (url: URL) => url.pathname === pathname;

test.describe("a browser that prefers Irish", () => {
  test.use({ locale: "ga-IE" });

  test("is sent to the Irish page, can switch to English, and the choice sticks", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(at("/ga/about"));
    await expect(page.locator("html")).toHaveAttribute("lang", "ga");
    await expect(page.getByRole("link", { name: localeNames.ga })).toHaveAttribute("aria-current", "true");

    await page.getByRole("link", { name: localeNames.en }).click();
    await expect(page).toHaveURL(at("/about"));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // The browser still asks for Irish, but the visitor has chosen: opening the English URL again stays on it.
    await page.goto("/about");
    await expect(page).toHaveURL(at("/about"));
  });
});

test.describe("a browser that prefers English", () => {
  test.use({ locale: "en-IE" });

  test("stays on English, and an Irish link is kept as asked", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(at("/about"));

    await page.goto("/ga/about");
    await expect(page).toHaveURL(at("/ga/about"));
    await expect(page.locator("html")).toHaveAttribute("lang", "ga");
  });

  test("can choose Irish, and the choice sticks", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: localeNames.ga }).click();
    await expect(page).toHaveURL(at("/ga/about"));

    await page.goto("/about");
    await expect(page).toHaveURL(at("/ga/about"));
  });
});
