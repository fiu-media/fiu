import { expect, test } from "@playwright/test";

import { localeNames } from "../lib/i18n/config";
import { en } from "../lib/i18n/dictionaries/en";
import { ga } from "../lib/i18n/dictionaries/ga";
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
// starves the page's main thread, so the click on the menu link can stall past the test timeout. The scroll checks
// have nothing to do with the scene, so these tests run against the static hero.
test.describe("on Home", () => {
  test.use({ reducedMotion: "reduce" });

  test("on a phone Home rests on the hero, scrolls down to its fold and eases back up from the bleed", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const scrollY = () => page.evaluate(() => window.scrollY);
    // The hero starts below the top bleed (the notch's height). Scrolled up into it and
    // left alone, the page settles back.
    const heroTop = () =>
      page.evaluate(() => (document.querySelector("[data-hero]")?.getBoundingClientRect().top ?? 0) + window.scrollY);
    await expect.poll(scrollY).toBe(await heroTop());
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(scrollY).toBe(await heroTop());

    // The fold is reachable by scrolling. Its link to About is always there; the team photo only once one is uploaded.
    const about = page.getByRole("region", { name: en.nav.about }).getByRole("link", { name: en.home.aboutCta });
    await about.scrollIntoViewIfNeeded();
    await expect(about).toBeInViewport();
    expect(await scrollY()).toBeGreaterThan(await heroTop());
  });
});

// A landscape phone is wide enough for `md` but too short for the rail, whose labels (Irish ones especially) and
// language switcher need about 620px. It gets the phone bar and menu instead.
test.describe("on a short, wide screen", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  for (const [path, nav] of [
    ["/about", en.nav],
    ["/ga/about", ga.nav],
  ] as const) {
    test(`${path} reaches every link and both languages through the menu`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("aside")).toBeHidden();
      const dialog = page.getByRole("dialog", { name: nav.label });
      await clickUntil(page.getByRole("button", { name: nav.menu }), () => expect(dialog).toBeVisible({ timeout: 1000 }));
      for (const name of [nav.about, nav.work, nav.talent, nav.contact]) {
        await expect(dialog.getByRole("link", { name })).toBeInViewport();
      }
      await expect(dialog.getByRole("link", { name: localeNames.en })).toBeInViewport();
      await expect(dialog.getByRole("link", { name: localeNames.ga })).toBeInViewport();
    });
  }

  test("a tall desktop window keeps the rail", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/about");
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.getByRole("button", { name: en.nav.menu })).toBeHidden();
  });
});
