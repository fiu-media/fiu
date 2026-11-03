import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { testEmail } from "./helpers";

const { contact, talent } = en;
const picker = (page: Page) => page.getByRole("group", { name: new RegExp(contact.talent.replace("?", "\\?")) });

/** The first profile on the roster: its path, slug and name. */
async function firstProfile(page: Page) {
  await page.goto("/talent");
  const href = await page
    .locator('a[href^="/talent/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!).find((h) => h.length > "/talent/".length));
  if (!href) return null;
  await page.goto(href);
  const name = (await page.getByRole("heading", { level: 1 }).first().innerText()).trim();
  return { href, slug: href.split("/").pop()!, name };
}

test.describe("contact form: talent", () => {
  test('"Work with" opens the form for a Talent enquiry with that person already picked', async ({ page }) => {
    const person = await firstProfile(page);
    test.skip(!person, "No talent in this dataset");

    await page.getByRole("link", { name: format(talent.workWith, { name: person!.name }) }).click();
    await expect(page).toHaveURL(new RegExp(`type=Talent&talent=${person!.slug}`));
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Talent");
    await expect(picker(page)).toBeVisible();
    await expect(page.getByRole("checkbox", { name: person!.name })).toBeChecked();
  });

  test("any number of people can be picked, and the enquiry is sent", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    await expect(picker(page)).toBeVisible();
    const boxes = picker(page).getByRole("checkbox");
    const count = await boxes.count();
    test.skip(count < 2, "Needs at least two people on the roster");
    await expect(picker(page).locator("input:checked")).toHaveCount(0);

    await boxes.nth(0).check({ force: true });
    await boxes.nth(1).check({ force: true });
    await expect(picker(page).locator("input:checked")).toHaveCount(2);
    await boxes.nth(0).uncheck({ force: true });
    await expect(picker(page).locator("input:checked")).toHaveCount(1);
    await boxes.nth(0).check({ force: true });

    await page.getByLabel(contact.name).fill("E2E Tester");
    await page.getByLabel(contact.email).fill(testEmail());
    await page.getByLabel(contact.message).fill("Hello about two of you.");
    await page.getByRole("button", { name: contact.submit }).click();
    await expect(page.getByRole("heading", { name: contact.successTitle })).toBeVisible();
  });

  test("the picker only shows for a Talent enquiry, and unknown people in the link are ignored", async ({ page }) => {
    await page.goto("/contact?type=Talent&talent=nobody-by-this-name");
    await expect(picker(page)).toBeVisible();
    await expect(picker(page).locator("input:checked")).toHaveCount(0);

    await page.getByLabel(contact.enquiryType).selectOption("Rentals");
    await expect(picker(page)).toHaveCount(0);
    await page.getByLabel(contact.enquiryType).selectOption("Talent");
    await expect(picker(page)).toBeVisible();

    await page.goto("/contact?type=Project");
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Project");
    await expect(picker(page)).toHaveCount(0);
  });
});
