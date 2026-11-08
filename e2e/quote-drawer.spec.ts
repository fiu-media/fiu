import { expect, type Page, test } from "@playwright/test";

import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { rentalItems } from "./fixtures/data";
import { clickUntil } from "./helpers";

const { basket, rentals } = en;

/** Adds the first catalogue item and returns the basket pill. */
async function withOneItem(page: Page) {
  await page.goto("/rentals");
  const added = page.getByRole("button", { name: format(rentals.inQuote, { qty: 1 }) }).first();
  await clickUntil(page.getByRole("button", { name: rentals.addToQuote }).first(), () =>
    expect(added).toBeVisible({ timeout: 1000 }),
  );
  return page.getByRole("button", { name: /^Open quote basket/ });
}

test("the quote drawer closes on Escape and on the backdrop, returning focus to its pill", async ({ page }) => {
  const pill = await withOneItem(page);
  const drawer = page.getByRole("dialog", { name: basket.title });

  await pill.click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(pill).toBeFocused();

  await pill.click();
  await expect(drawer).toBeVisible();
  // Outside the panel, on the left of the screen.
  await page.mouse.click(10, 300);
  await expect(drawer).toBeHidden();
});

test("a basket quantity can be typed and stepped, and stays within the item's cap", async ({ page }) => {
  // The quote page shows the same lines as the drawer. The item has five in stock, so it can be quoted more than once.
  await page.goto(`/rentals/quote?item=${rentalItems.multi.slug}`);
  const qty = page.getByRole("textbox", { name: /^Quantity of / });
  const more = page.getByRole("button", { name: /^Add one more / });
  await expect(qty).toHaveValue("1");
  await expect(more).toBeEnabled();

  await qty.fill("2");
  await qty.blur();
  await expect(qty).toHaveValue("2");
  await page.getByRole("button", { name: /^Remove one / }).click();
  await expect(qty).toHaveValue("1");
  // At 1 there is nothing to take away; the line is removed with its own button instead.
  await expect(page.getByRole("button", { name: /^Remove one / })).toBeDisabled();

  // Past the item's cap (and never past 99) it settles on the cap.
  await qty.fill("500");
  await qty.blur();
  await expect(qty).toHaveValue(String(rentalItems.multi.maxQuantity));
  await expect(more).toBeDisabled();
});
