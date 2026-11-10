import { expect, type Locator, test } from "@playwright/test";

import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { clickUntil, isoDateFromNow, rentalsTest } from "./helpers";

const { rentals, forms, quote } = en;

const placeholderColor = (field: Locator) => field.evaluate((el) => getComputedStyle(el, "::placeholder").color);
const textColor = (field: Locator) => field.evaluate((el) => getComputedStyle(el).color);

/** Every text field gives an example, and the example isn't just the label again. */
async function expectExamples(form: Locator) {
  const fields = form.locator("input:not([type=hidden]):not([type=date]):not([name=website]), textarea");
  const count = await fields.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const field = fields.nth(i);
    const label = await field.evaluate((el) => (el as HTMLInputElement).labels?.[0]?.textContent ?? "");
    // Plumbing that carries a value (the phone's hidden control) has no label and nothing to type into.
    if (!label) continue;
    await expect(field, `a field labelled "${label}"`).toHaveAttribute("placeholder", /./);
    const placeholder = (await field.getAttribute("placeholder")) ?? "";
    expect(label, `placeholder "${placeholder}"`).not.toContain(placeholder);
  }
}

test.describe("placeholders", () => {
  test("the contact form gives an example in every text field", async ({ page }) => {
    await page.goto("/contact");
    // The form streams in behind a skeleton.
    await expect(page.getByLabel(forms.fields.name)).toBeVisible();
    await expectExamples(page.locator("form"));
  });

  // Rentals is hidden while `features.rentals` is off (see playwright.config.ts).
  rentalsTest("the quote form gives one too, and its dates and phone look the same", async ({ page }) => {
    await page.goto("/rentals");
    const added = page.getByRole("button", { name: format(rentals.inQuote, { qty: 1 }) }).first();
    await clickUntil(page.getByRole("button", { name: rentals.addToQuote }).first(), () =>
      expect(added).toBeVisible({ timeout: 1000 }),
    );
    await page.goto("/rentals/quote");
    // The form appears once the basket has been read from the browser.
    await expect(page.getByLabel(forms.fields.name)).toBeVisible();
    await expectExamples(page.locator("form"));

    const name = page.getByLabel(forms.fields.name);
    const reference = await placeholderColor(name);
    // The browser's own "dd/mm/yyyy" and the phone sample are the same grey as the examples above.
    const pickUp = page.getByLabel(quote.startDate);
    expect(await textColor(pickUp)).toBe(reference);
    expect(await placeholderColor(page.getByRole("textbox", { name: /^Phone/ }))).toBe(reference);

    // Once there is a date, it is ordinary text again.
    await pickUp.fill(isoDateFromNow(14));
    await page.getByLabel(forms.fields.name).focus();
    expect(await textColor(pickUp)).not.toBe(reference);
  });
});
