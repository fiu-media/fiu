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
    // Ireland (+353) is preselected, so a national number is enough.
    await page.getByRole("textbox", { name: /^Phone/ }).pressSequentially("871234567");
    await page.getByRole("button", { name: quote.submit }).click();

    await expect(page.getByRole("heading", { name: quote.successTitle })).toBeVisible();
    // A sent request empties the basket.
    await page.goto("/rentals/quote");
    await expect(page.getByText(quote.emptyBasket)).toBeVisible();
  });

  test("the phone field formats a number, offers countries, and checks it on blur", async ({ page }) => {
    const number = page.getByRole("textbox", { name: /^Phone/ });
    const country = page.getByRole("combobox", { name: /country/i });
    await expect(country).toHaveValue("IE");
    await expect(number).toHaveAttribute("placeholder", "(83) 123 4567");
    await expect(page.getByText("+353", { exact: true })).toBeVisible();

    // Irish numbers are written with a leading 0, which isn't part of the number.
    await number.pressSequentially("0871234567");
    await expect(number).toHaveValue("087 123 4567");
    await number.blur();
    await expect(number).not.toHaveAttribute("aria-invalid", "true");

    await country.selectOption("GB");
    await expect(page.getByText("+44", { exact: true })).toBeVisible();
    await number.fill("1");
    await number.blur();
    await expect(number).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(forms.errors.phoneInvalid)).toBeVisible();
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

  test("a pick-up in the past is caught before anything is sent", async ({ page }) => {
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

  test("an error only the server knows about comes back in the summary", async ({ page }) => {
    // An item that has since been unpublished: the browser can't tell, the server can.
    await page.evaluate(() => {
      const key = "fiu:quote-basket";
      const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
      stored.state.lines.push({ itemId: "rental-no-longer-exists", qty: 1 });
      localStorage.setItem(key, JSON.stringify(stored));
    });
    await page.reload();

    await page.getByLabel(quote.startDate).fill(isoDateFromNow(14));
    await page.getByLabel(quote.endDate).fill(isoDateFromNow(16));
    await page.getByLabel(quote.name).fill("E2E Tester");
    await page.getByLabel(quote.email).fill(testEmail());
    await page.getByRole("button", { name: quote.submit }).click();

    const summary = page.getByRole("alert").filter({ hasText: forms.errors.unavailable });
    await expect(summary).toBeFocused();
    await expect(page.getByText(en.basket.unknownItem)).toBeVisible();
    await expect(page.getByLabel(quote.name)).toHaveValue("E2E Tester");
  });
});
