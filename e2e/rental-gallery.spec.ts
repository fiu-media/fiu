import { expect, test, type Page } from "@playwright/test";
import { clickUntil } from "./helpers";

/** Opens the first rental item that has more than one photo, or skips when the dataset has none. */
async function openGallery(page: Page) {
  await page.goto("/rentals");
  const hrefs = await page
    .locator('a[href^="/rentals/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!).filter((href) => href !== "/rentals/quote"));
  for (const href of [...new Set(hrefs)]) {
    await page.goto(href);
    const gallery = page.getByRole("group", { name: /^Photos of / });
    if ((await gallery.count()) && (await gallery.getByRole("button", { name: /^Show photo/ }).count()) > 1) return gallery;
  }
  test.skip(true, "No rental item with several photos in this dataset");
}

test("rental gallery: buttons, keyboard, thumbnails and swipe stay in sync", async ({ page }) => {
  const gallery = (await openGallery(page))!;
  const thumbs = gallery.getByRole("button", { name: /^Show photo/ });
  const current = gallery.locator('button[aria-current="true"]');

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

  // Only the current slide is exposed to assistive tech.
  await expect(gallery.getByRole("group", { name: /^Photo \d+ of / })).toHaveCount(1);

  // Dragging the main photo advances it.
  const photo = gallery.getByRole("group", { name: /^Photo 1 of / });
  const box = (await photo.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(current).toHaveAttribute("aria-label", /^Show photo 2 of /);
});
