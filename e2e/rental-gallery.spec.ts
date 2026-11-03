import { expect, test, type Page } from "@playwright/test";
import { clickUntil } from "./helpers";

/** Opens the first rental item that has more than one photo, or skips when the dataset has none. */
async function openGallery(page: Page) {
  await page.goto("/rentals");
  // The catalogue renders after the page loads; wait for it so "none" means none, not "not yet".
  await page.locator('a[href^="/rentals/"]:not([href="/rentals/quote"])').first().waitFor({ timeout: 15_000 });
  const hrefs = await page
    .locator('a[href^="/rentals/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!).filter((href) => href !== "/rentals/quote"));
  for (const href of [...new Set(hrefs)]) {
    await page.goto(href);
    // The gallery streams in after the page loads.
    await page.waitForLoadState("networkidle");
    const gallery = page.getByRole("group", { name: /^Photos of / });
    if ((await gallery.count()) && (await gallery.getByRole("tab", { name: /^Show photo/ }).count()) > 1) return gallery;
  }
  test.skip(true, "No rental item with several photos in this dataset");
}

test("rental gallery: buttons, keyboard, thumbnails and swipe stay in sync", async ({ page }) => {
  const gallery = (await openGallery(page))!;
  const thumbs = gallery.getByRole("tab", { name: /^Show photo/ });
  const current = gallery.getByRole("tab", { selected: true });

  await expect(current).toHaveAttribute("aria-label", /^Show photo 1 of /);

  await clickUntil(gallery.getByRole("button", { name: "Next photo" }), () =>
    expect(current).toHaveAttribute("aria-label", /^Show photo 2 of /),
  );

  // Arrow keys from a thumbnail move the selection and the focus with it.
  await thumbs.nth(1).focus();
  await page.keyboard.press("ArrowRight");
  await expect(current).toHaveAttribute("aria-label", /^Show photo 3 of /);
  await expect(thumbs.nth(2)).toBeFocused();

  await page.keyboard.press("Home");
  await expect(current).toHaveAttribute("aria-label", /^Show photo 1 of /);

  // The arrow keys on the large photo change it too, and leave focus where it is.
  const large = gallery.locator("div[tabindex='0']").first();
  await large.focus();
  await page.keyboard.press("ArrowRight");
  await expect(current).toHaveAttribute("aria-label", /^Show photo 2 of /);
  await expect(large).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(current).toHaveAttribute("aria-label", /^Show photo 1 of /);

  // Only the current slide is exposed to assistive tech.
  await expect(gallery.getByRole("tabpanel", { name: /^Photo \d+ of / })).toHaveCount(1);

  // The strip is one Tab stop: tabbing out of it leaves the gallery.
  await thumbs.first().focus();
  await page.keyboard.press("Tab");
  await expect(thumbs.nth(1)).not.toBeFocused();

  // Dragging the main photo advances it.
  const photo = gallery.getByRole("tabpanel", { name: /^Photo 1 of / });
  const box = (await photo.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(current).toHaveAttribute("aria-label", /^Show photo 2 of /);
});
