import { expect, test } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { testEmail } from "./helpers";

const { contact, forms } = en;

test.describe("contact form", () => {
  test("?type= preselects the enquiry type", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Talent");
  });

  test("an unknown ?type= falls back to the first option", async ({ page }) => {
    await page.goto("/contact?type=Nonsense");
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Project");
  });

  test("a failed submission moves focus to the error summary", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(contact.name).fill("E2E Tester");
    // Valid for the browser, rejected by the server, so the error comes back from the action.
    await page.getByLabel(contact.email).fill("tester@localhost");
    await page.getByLabel(contact.message).fill("Hello");
    await page.getByRole("button", { name: contact.submit }).click();

    const summary = page.getByRole("alert").filter({ hasText: forms.errorSummary });
    await expect(summary).toBeFocused();
    await expect(summary.getByRole("link", { name: contact.email })).toHaveAttribute("href", "#field-email");
  });

  test("a valid message is sent", async ({ page }) => {
    await page.goto("/contact?type=Rentals");
    await page.getByLabel(contact.name).fill("E2E Tester");
    await page.getByLabel(contact.email).fill(testEmail());
    await page.getByLabel(contact.message).fill("Hello from the e2e suite.");
    await page.getByRole("button", { name: contact.submit }).click();

    await expect(page.getByRole("heading", { name: contact.successTitle })).toBeVisible();
  });
});
