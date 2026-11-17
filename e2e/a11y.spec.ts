import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { featuredTalent, project, rentalItems } from "./fixtures/data";
import { clickUntil, skipWithoutRentals, waitForAnimations, waitForImagesAndFonts } from "./helpers";

/**
 * Axe's automated rules catch roughly a third of WCAG problems, so a pass is a floor, not a
 * verdict (manual review lives in #11). Any violation fails the test.
 */
const PAGES = ["/about", "/work", `/work/${project.slug}`, "/talent", "/contact", "/contact?type=Talent", "/privacy"];
// Irish: Contact (labels and the form), Work (a cinematic page); Home is below. Longer or missing accessible names show up here.
const GA_PAGES = ["/ga/contact", "/ga/work"];

async function audit(page: Page, path: string, open?: (page: Page) => Promise<void>) {
  await page.goto(path);
  // Wait for the page to settle (images and fonts in) before measuring.
  await waitForImagesAndFonts(page);
  await open?.(page);
  // axe checks that headings exist and don't skip levels, not that the page has exactly one title.
  await expect(page.locator("h1"), `One <h1> on ${path}`).toHaveCount(1);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `  ${n.target.join(" ")}`).join("\n")}`),
    `Accessibility violations on ${path}`,
  ).toEqual([]);
}

for (const path of [...PAGES, ...GA_PAGES]) {
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

  test("axe: /ga", async ({ page }) => {
    await audit(page, "/ga");
  });
});

test("axe: the not-found page", async ({ page }) => {
  await audit(page, "/work/no-such-project", async (page) => {
    // The project streams in behind Suspense, so the 404 replaces the placeholder after the load.
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});

// Rentals is hidden while `features.rentals` is off (see playwright.config.ts).
test("axe: a rental item page", async ({ page }) => {
  skipWithoutRentals();
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
      await waitForAnimations(dialog);
    });
  });

  test("axe: the stills lightbox", async ({ page }) => {
    await audit(page, `/work/${project.slug}`, async (page) => {
      await clickUntil(page.getByRole("button", { name: /^View still 1 of \d+$/ }), () =>
        expect(page.getByRole("dialog")).toBeVisible({ timeout: 1000 }),
      );
      await waitForAnimations(page.getByRole("dialog"));
    });
  });

  test("axe: the quote drawer", async ({ page }) => {
    skipWithoutRentals();
    await audit(page, "/rentals", async (page) => {
      const added = page.getByRole("button", { name: format(en.rentals.inQuote, { qty: 1 }) }).first();
      await clickUntil(page.getByRole("button", { name: en.rentals.addToQuote }).first(), () =>
        expect(added).toBeVisible({ timeout: 1000 }),
      );
      await page.getByRole("button", { name: /^Open quote basket/ }).click();
      const drawer = page.getByRole("dialog", { name: en.basket.title });
      await expect(drawer).toBeVisible();
      // As above, the drawer's slide-in has to finish.
      await waitForAnimations(drawer);
    });
  });
});
