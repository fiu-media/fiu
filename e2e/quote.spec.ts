import { expect, test } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { clickUntil, isoDateFromNow, testEmail } from "./helpers";

const { quote, rentals, forms } = en;

test.describe("quote request", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rentals");
    // Once added, the button's name becomes "In quote (1)", so the check looks for that name instead.
    const added = page.getByRole("button", { name: format(rentals.inQuote, { qty: 1 }) }).first();
    await clickUntil(page.getByRole("button", { name: rentals.addToQuote }).first(), () =>
      expect(added).toBeVisible({ timeout: 1000 }),
    );
    await page.goto("/rentals/quote");
  });

  test("the basket carries over to the form and a request can be sent", async ({ page }) => {
    await expect(page.getByRole("heading", { name: quote.itemsHeading })).toBeVisible();

    await page.getByLabel(quote.startDate).fill(isoDateFromNow(14));
    await page.getByLabel(quote.endDate).fill(isoDateFromNow(16));
    await page.getByLabel(quote.name).fill("E2E Tester");
    await page.getByLabel(quote.email).fill(testEmail());
    await page.getByRole("button", { name: quote.submit }).click();

    await expect(page.getByRole("heading", { name: quote.successTitle })).toBeVisible();
    // A sent request empties the basket.
    await page.goto("/rentals/quote");
    await expect(page.getByText(quote.emptyBasket)).toBeVisible();
  });

  test("a validation error is announced and focused", async ({ page }) => {
    await page.getByLabel(quote.startDate).fill(isoDateFromNow(14));
    await page.getByLabel(quote.endDate).fill(isoDateFromNow(16));
    await page.getByLabel(quote.name).fill("E2E Tester");
    await page.getByLabel(quote.email).fill("tester@localhost");
    await page.getByRole("button", { name: quote.submit }).click();

    const summary = page.getByRole("alert").filter({ hasText: forms.errorSummary });
    await expect(summary).toBeFocused();
    const link = summary.getByRole("link", { name: quote.email });
    await expect(link).toHaveAttribute("href", `#${await page.getByLabel(quote.email).getAttribute("id")}`);
    // The visitor's input survives the failed attempt.
    await expect(page.getByLabel(quote.name)).toHaveValue("E2E Tester");
  });

  test("a server-side validation error comes back in the same summary", async ({ page }) => {
    // Passes the schema the browser shares with the server; only the server knows today's date.
    await page.getByLabel(quote.startDate).fill(isoDateFromNow(-3));
    await page.getByLabel(quote.endDate).fill(isoDateFromNow(2));
    await page.getByLabel(quote.name).fill("E2E Tester");
    await page.getByLabel(quote.email).fill(testEmail());
    await page.getByRole("button", { name: quote.submit }).click();

    const summary = page.getByRole("alert").filter({ hasText: forms.errorSummary });
    await expect(summary).toBeFocused();
    await expect(summary.getByText(forms.errors.past)).toBeVisible();
    await expect(page.getByLabel(quote.name)).toHaveValue("E2E Tester");
  });
});
