import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { format } from "../lib/i18n/format";
import { featuredTalent } from "./fixtures/data";
import { testEmail } from "./helpers";

const { contact, talent } = en;
const combobox = (page: Page) => page.getByRole("combobox", { name: new RegExp(contact.talent.legend.replace("?", "\\?")) });
const chips = (page: Page) => page.getByRole("button", { name: /^Remove / });

/** Opens the fixture profile the talent tests use, and returns its path, slug and name. */
async function openProfile(page: Page) {
  await page.goto(featuredTalent.path);
  await expect(page.getByRole("heading", { level: 1, name: featuredTalent.name })).toBeVisible();
  return { href: featuredTalent.path, slug: featuredTalent.slug, name: featuredTalent.name };
}

test.describe("contact form: talent", () => {
  test('"Work with" opens the form for a Talent enquiry with that person already picked', async ({ page }) => {
    const person = await openProfile(page);

    await page.getByRole("link", { name: format(talent.workWith, { name: person.name }) }).click();
    await expect(page).toHaveURL(new RegExp(`type=Talent&talent=${person.slug}`));
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Talent");
    await expect(combobox(page)).toBeVisible();
    await expect(chips(page)).toHaveCount(1);
    await expect(page.getByRole("button", { name: format(contact.talent.remove, { name: person.name }) })).toBeVisible();
  });

  test('"Work with" after browsing away from a half-filled form starts it over with that person picked', async ({ page }) => {
    await page.goto("/contact?type=Rentals");
    await page.getByLabel(contact.name).fill("Half Filled");
    await page.getByLabel(contact.email).fill("nope");
    await page.getByLabel(contact.message).focus();
    await expect(page.getByText(en.forms.errors.emailInvalid)).toBeVisible();

    // Browse within the app, not by reloading, so the contact page's state is kept alive.
    await page.getByRole("link", { name: "Talent", exact: true }).first().click();
    await page.waitForURL(/\/talent$/);
    await page.locator(`a[href="${featuredTalent.path}"]`).click();
    await page.getByRole("link", { name: /^Work with / }).click();
    await page.waitForURL(/\/contact\?/);

    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Talent");
    await expect(chips(page)).toHaveCount(1);
    await expect(page.getByLabel(contact.name)).toHaveValue("");
    await expect(page.getByLabel(contact.email)).toHaveValue("");
    await expect(page.getByText(en.forms.errors.emailInvalid)).toHaveCount(0);
  });

  test('the same "Work with" link again starts the form over, even after a message was sent', async ({ page }) => {
    const person = await openProfile(page);
    const workWith = () => page.getByRole("link", { name: format(talent.workWith, { name: person.name }) });

    await workWith().click();
    await page.getByLabel(contact.name).fill("E2E Tester");
    await page.getByLabel(contact.email).fill(testEmail());
    await page.getByLabel(contact.message).fill("Hello once.");
    await page.getByRole("button", { name: contact.submit }).click();
    await expect(page.getByRole("heading", { name: contact.successTitle })).toBeVisible();

    // Back to the same profile within the app (no reload, so the contact page's state is kept), and the very same
    // link: a new enquiry, not the "Message sent" panel.
    await page.getByRole("link", { name: "Talent", exact: true }).first().click();
    await page.waitForURL(/\/talent$/);
    await page.locator(`a[href="${person.href}"]`).click();
    await workWith().click();
    await page.waitForURL(/\/contact\?/);
    await expect(page.getByRole("heading", { name: contact.successTitle })).toHaveCount(0);
    await expect(page.getByLabel(contact.name)).toHaveValue("");
    await expect(chips(page)).toHaveCount(1);
  });

  test("an unsent form is also started over by the very same link", async ({ page }) => {
    const person = await openProfile(page);
    const workWith = () => page.getByRole("link", { name: format(talent.workWith, { name: person.name }) });

    await workWith().click();
    await expect(chips(page)).toHaveCount(1);
    await page.getByLabel(contact.name).fill("Half Filled");
    await chips(page).first().click();
    await expect(chips(page)).toHaveCount(0);

    // Browse within the app (no reload), then follow the same link.
    await page.getByRole("link", { name: "Talent", exact: true }).first().click();
    await page.waitForURL(/\/talent$/);
    await page.locator(`a[href="${person.href}"]`).click();
    await workWith().click();
    await page.waitForURL(/\/contact\?/);
    await expect(page.getByLabel(contact.name)).toHaveValue("");
    await expect(chips(page)).toHaveCount(1);
  });

  test("coming back to the form by its plain link keeps a half-written message", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(contact.name).fill("Half Filled");
    await page.getByRole("link", { name: "Talent", exact: true }).first().click();
    await page.waitForURL(/\/talent$/);
    await page.getByRole("link", { name: "Contact", exact: true }).first().click();
    await page.waitForURL(/\/contact$/);
    await expect(page.getByLabel(contact.name)).toHaveValue("Half Filled");
  });

  test("people are found by typing, picked from a list that stays open, and removed from their chips", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    const input = combobox(page);
    await expect(input).toBeVisible();
    await expect(chips(page)).toHaveCount(0);

    await input.click();
    const options = page.getByRole("option");
    const everyone = await options.count();
    expect(everyone).toBeGreaterThanOrEqual(2);

    // Typing narrows the list; a name with no match says so.
    const first = (await options.first().innerText()).replace("✓", "").trim();
    await input.fill(first.slice(0, 3));
    await expect(options.first()).toContainText(first.slice(0, 3), { ignoreCase: true });
    await input.fill("zzzz-nobody");
    await expect(page.getByText(contact.talent.empty)).toBeVisible();
    await input.fill("");

    // Several picks from one opening of the list.
    await options.nth(0).click();
    await options.nth(1).click();
    await expect(chips(page)).toHaveCount(2);
    await expect(options.first()).toBeVisible();

    // Remove one with its button, then the other with the keyboard.
    await chips(page).first().click();
    await expect(chips(page)).toHaveCount(1);
    await input.click();
    await input.press("Backspace");
    await page.keyboard.press("Backspace");
    await expect(chips(page)).toHaveCount(0);
  });

  test("no more than 20 people can be picked, and the list says so", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    const input = combobox(page);
    await input.click();
    const options = page.getByRole("option");
    const everyone = await options.count();
    expect(everyone).toBeGreaterThan(20);

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
    }
    await expect(chips(page)).toHaveCount(20);
    await expect(page.getByText(format(contact.talent.limit, { max: 20 }))).toBeVisible();
    await expect(page.getByRole("option", { disabled: true })).toHaveCount(everyone - 20);

    // Someone already picked can still be taken off, which frees a place.
    await chips(page).first().click();
    await expect(chips(page)).toHaveCount(19);
  });

  test("the open list has no accessibility violations beyond the page being hidden behind it", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    await combobox(page).click();
    await expect(page.getByRole("option").first()).toBeVisible();
    // While the list is open, Base UI hides the rest of the page from assistive tech on purpose, and axe flags
    // the focusable fields inside it. Anything else is ours to fix.
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["aria-hidden-focus"])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("the enquiry is sent with the people picked", async ({ page }) => {
    await page.goto("/contact?type=Talent");
    const input = combobox(page);
    await input.click();
    const options = page.getByRole("option");
    expect(await options.count()).toBeGreaterThanOrEqual(2);
    await options.nth(0).click();
    await options.nth(1).click();
    await page.keyboard.press("Escape");
    await expect(chips(page)).toHaveCount(2);

    await page.getByLabel(contact.name).fill("E2E Tester");
    await page.getByLabel(contact.email).fill(testEmail());
    await page.getByLabel(contact.message).fill("Hello about two of you.");
    await page.getByRole("button", { name: contact.submit }).click();
    await expect(page.getByRole("heading", { name: contact.successTitle })).toBeVisible();
  });

  test("the picker only shows for a Talent enquiry, and unknown people in the link are ignored", async ({ page }) => {
    await page.goto("/contact?type=Talent&talent=nobody-by-this-name");
    await expect(combobox(page)).toBeVisible();
    await expect(chips(page)).toHaveCount(0);

    await page.getByLabel(contact.enquiryType).selectOption("Rentals");
    await expect(combobox(page)).toHaveCount(0);
    await page.getByLabel(contact.enquiryType).selectOption("Talent");
    await expect(combobox(page)).toBeVisible();

    await page.goto("/contact?type=Project");
    await expect(page.getByLabel(contact.enquiryType)).toHaveValue("Project");
    await expect(combobox(page)).toHaveCount(0);
  });
});
