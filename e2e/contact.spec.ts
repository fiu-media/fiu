import { expect, test } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { testEmail } from "./helpers";

const { contact, forms } = en;

test.describe("contact form", () => {
  test("an address with an accent, which Irish names often have, is accepted", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(contact.name).fill("Seán Ó Súilleabháin");
    await page.getByLabel(contact.email).fill(testEmail().replace("e2e-", "seán-"));
    await page.getByLabel(contact.message).fill("Hello from an address with a fada.");
    await page.getByRole("button", { name: contact.submit }).click();

    await expect(page.getByRole("heading", { name: contact.successTitle })).toBeVisible();
    // Resend can't deliver to this address, so the page mustn't claim a copy was emailed.
    await expect(page.getByText(contact.successBodyNoEmail)).toBeVisible();
  });

  test("?type= preselects the enquiry type", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Talent");
  });

  test("an unknown ?type= falls back to the first option", async ({ page }) => {
    await page.goto("/contact?type=Nonsense");
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Project");
  });

  test("a field is checked as soon as it loses focus", async ({ page }) => {
    await page.goto("/contact");
    const email = page.getByLabel(contact.email);
    await email.fill("nope");
    await page.getByLabel(contact.message).focus();

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(forms.errors.emailInvalid)).toBeVisible();
    // Nothing has been submitted yet, so no summary.
    await expect(page.getByRole("alert").filter({ hasText: forms.errorSummary })).toHaveCount(0);
  });

  test("a pasted email with stray spaces is accepted, and the fields stop at their limit", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(contact.name).fill("x".repeat(200));
    await expect(page.getByLabel(contact.name)).toHaveValue("x".repeat(120));

    const email = page.getByLabel(contact.email);
    await email.fill("  a@example.com ");
    await page.getByLabel(contact.message).focus();
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
  });

  test("a failed submission moves focus to the error summary", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(contact.name).fill("E2E Tester");
    await page.getByLabel(contact.email).fill("tester@localhost");
    await page.getByLabel(contact.message).fill("Hello");
    await page.getByRole("button", { name: contact.submit }).click();

    const summary = page.getByRole("alert").filter({ hasText: forms.errorSummary });
    await expect(summary).toBeFocused();
    const link = summary.getByRole("link", { name: contact.email });
    await expect(link).toHaveAttribute("href", `#${await page.getByLabel(contact.email).getAttribute("id")}`);
    // The visitor's input survives the failed attempt.
    await expect(page.getByLabel(contact.name)).toHaveValue("E2E Tester");
  });

  test("browsers can autofill it: standard autocomplete tokens, and a honeypot they are told to leave alone", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page.getByLabel(contact.name)).toHaveAttribute("autocomplete", "name");
    await expect(page.getByLabel(contact.email)).toHaveAttribute("autocomplete", "email");
    await expect(page.getByRole("textbox", { name: /^Phone/ })).toHaveAttribute("autocomplete", "tel");

    const honeypot = page.locator("input[name=website]");
    await expect(honeypot).toHaveAttribute("autocomplete", "off");
    for (const optOut of ["data-1p-ignore", "data-lpignore", "data-bwignore", "data-form-type"]) {
      await expect(honeypot, optOut).toHaveAttribute(optOut);
    }
  });

  test("values set the way a browser's autofill sets them are kept and sent", async ({ page }) => {
    await page.goto("/contact");
    // Autofill assigns the value and fires input and change, which is all Playwright's `fill` does too, but for the
    // phone it arrives already written out in full, in whichever format the browser saved.
    await page.getByLabel(contact.name).fill("Aoife Ní Bhriain");
    await page.getByLabel(contact.email).fill(testEmail());
    const number = page.getByRole("textbox", { name: /^Phone/ });
    await number.fill("+353 83 123 4567");
    await expect(number).toHaveValue("(83) 123 4567");
    await page.getByLabel(contact.message).fill("Hello from an autofilled form.");
    await page.getByRole("button", { name: contact.submit }).click();

    await expect(page.getByRole("heading", { name: contact.successTitle })).toBeVisible();
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
