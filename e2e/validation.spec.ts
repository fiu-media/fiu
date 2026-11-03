import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";

const { contact, forms } = en;

/**
 * How the forms validate ("reward early, punish late"):
 * 1. typing in a field for the first time shows nothing;
 * 2. leaving the field checks it and shows any error;
 * 3. a field that has an error is re-checked as you type, so the error goes as soon as the input is valid;
 * 4. submitting checks everything, and the error summary takes focus.
 */
async function openContact(page: Page) {
  await page.goto("/contact");
  await expect(page.getByLabel(contact.email)).toBeVisible();
}

const invalid = (page: Page, label: string) => page.getByLabel(label).getAttribute("aria-invalid");

test.describe("validation timing", () => {
  test("typing in a field for the first time shows nothing, however wrong it looks so far", async ({ page }) => {
    await openContact(page);
    const email = page.getByLabel(contact.email);
    await email.click();
    for (const typed of ["a", "a@", "a@b"]) {
      await email.fill(typed);
      await expect(page.getByText(forms.errors.emailInvalid)).toHaveCount(0);
      expect(await invalid(page, contact.email)).toBeNull();
    }
  });

  test("leaving the field checks it and shows the error inline", async ({ page }) => {
    await openContact(page);
    await page.getByLabel(contact.email).fill("a@b");
    await page.getByLabel(contact.message).focus();
    await expect(page.getByLabel(contact.email)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(forms.errors.emailInvalid)).toBeVisible();
    // Only on the field that was left, and no summary: nothing has been submitted.
    expect(await invalid(page, contact.name)).toBeNull();
    await expect(page.getByRole("alert").filter({ hasText: forms.errorSummary })).toHaveCount(0);
  });

  test("once a field has an error it is re-checked as you type, so the error goes the moment it is fixed", async ({ page }) => {
    await openContact(page);
    const email = page.getByLabel(contact.email);
    await email.fill("a@b");
    await page.getByLabel(contact.message).focus();
    await expect(page.getByText(forms.errors.emailInvalid)).toBeVisible();

    await email.focus();
    await email.pressSequentially(".");
    // "a@b." is still not an address, so the error stays; no tabbing away is needed to see the fix once it is one.
    await expect(page.getByText(forms.errors.emailInvalid)).toBeVisible();
    await email.pressSequentially("c");
    await expect(page.getByText(forms.errors.emailInvalid)).toHaveCount(0);
    expect(await invalid(page, contact.email)).toBeNull();

    // And it goes back to being quiet while editing: break it again, nothing until it is left.
    await email.press("Backspace");
    await email.press("Backspace");
    await expect(page.getByText(forms.errors.emailInvalid)).toHaveCount(0);
    await page.getByLabel(contact.message).focus();
    await expect(page.getByText(forms.errors.emailInvalid)).toBeVisible();
  });

  test("submitting checks everything, including fields never touched, and the summary takes focus", async ({ page }) => {
    await openContact(page);
    await page.getByRole("button", { name: contact.submit }).click();

    const summary = page.getByRole("alert").filter({ hasText: forms.errorSummary });
    await expect(summary).toBeFocused();
    for (const label of [contact.name, contact.email, contact.message]) {
      await expect(summary.getByRole("link", { name: label })).toBeVisible();
      await expect(page.getByLabel(label)).toHaveAttribute("aria-invalid", "true");
    }

    // Fixing a field clears its error and its line in the summary right away.
    await page.getByLabel(contact.name).fill("E2E Tester");
    await expect(page.getByLabel(contact.name)).not.toHaveAttribute("aria-invalid", "true");
    await expect(summary.getByRole("link", { name: contact.name })).toHaveCount(0);
    await expect(summary.getByRole("link", { name: contact.email })).toBeVisible();
  });

  test("the summary is announced once, then stays quiet while errors clear", async ({ page }) => {
    await openContact(page);
    await page.getByRole("button", { name: contact.submit }).click();
    const summary = page.getByRole("alert").filter({ hasText: forms.errorSummary });
    await expect(summary).toBeVisible();
    await expect(summary).not.toHaveAttribute("aria-live", "off");
    await expect(summary).toHaveAttribute("aria-live", "off", { timeout: 3000 });

    // A new failed attempt is announced again.
    await page.getByLabel(contact.name).fill("E2E Tester");
    await page.getByRole("button", { name: contact.submit }).click();
    await expect(summary).toBeFocused();
    await expect(summary).not.toHaveAttribute("aria-live", "off");
  });
});
