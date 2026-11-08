import { expect, type Page, test } from "@playwright/test";

import { rentalItems } from "./fixtures/data";
import { clickUntil } from "./helpers";

/** Opens the rental item that has several photos, and returns its gallery. */
async function openGallery(page: Page) {
  await page.goto(`/rentals/${rentalItems.multi.slug}`);
  // The gallery streams in after the page loads.
  await page.waitForLoadState("networkidle");
  const gallery = page.getByRole("group", { name: /^Photos of / });
  await expect(gallery.getByRole("tab", { name: /^Show photo/ })).toHaveCount(rentalItems.multi.photos.length);
  return gallery;
}

test("rental gallery: buttons, keyboard, thumbnails and swipe stay in sync", async ({ page }) => {
  const gallery = await openGallery(page);
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
