import { expect, type Page, test } from "@playwright/test";

import { localeNames, locales } from "../lib/i18n/config";
import { en } from "../lib/i18n/dictionaries/en";
import { getNavItems } from "../lib/i18n/nav";

const { nav, contact, forms } = en;

/** What has the keyboard's focus: its accessible name as a test can check it, and whether a focus ring is drawn. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    // A field made of several controls (the phone number) draws one ring around the whole field, not on the control.
    const ringed = [el, el.closest(".composite-field")].some((node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2;
    });
    const labelled = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    const name = el.getAttribute("aria-label") ?? (labelled ? el.labels?.[0]?.textContent : null) ?? el.textContent;
    return { name: name.trim(), ringed, inMain: el.closest("main") !== null };
  });

/** Press Tab and report where focus went. */
async function tab(page: Page) {
  await page.keyboard.press("Tab");
  const stop = await focused(page);
  if (!stop) throw new Error("Tab left the page without focusing anything");
  return stop;
}

/**
 * Tabs on until the stop called `last`, checking each one stays in the page and shows a ring, and returns their names.
 * Gives up after far more presses than a form has fields, so a missing stop fails the test and doesn't loop.
 */
async function tabUntil(page: Page, last: string, limit = 12) {
  const names: string[] = [];
  while (names.at(-1) !== last && names.length < limit) {
    const stop = await tab(page);
    expect(stop, `the stop after "${names.at(-1) ?? "the start"}"`).toMatchObject({ ringed: true, inMain: true });
    names.push(stop.name);
  }
  return names;
}

test.describe("keyboard", () => {
  test("the first Tab reaches the skip link, which moves focus into the page", async ({ page }) => {
    await page.goto("/contact");
    const skip = page.getByRole("link", { name: nav.skip });
    // Parked above the screen until it has focus.
    await expect(skip).not.toBeInViewport();

    expect(await tab(page)).toMatchObject({ name: nav.skip, ringed: true });
    await expect(skip).toBeInViewport();

    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    // The next stop is inside the page, not back in the rail.
    expect((await tab(page)).inMain).toBe(true);
  });

  test("Tab walks the rail in order, and every stop shows a focus ring", async ({ page }) => {
    await page.goto("/privacy");
    const expected = [
      nav.skip,
      nav.home,
      ...getNavItems("en", en).map((item) => item.label),
      // Each language reads as its code, then its own name for screen readers.
      ...locales.map((locale) => `${locale.toUpperCase()}, ${localeNames[locale]}`),
    ];
    for (const name of expected) {
      expect(await tab(page)).toMatchObject({ name, ringed: true, inMain: false });
    }
    // After the rail, the page.
    expect((await tab(page)).inMain).toBe(true);
  });

  test("the contact form can be filled in and sent from the keyboard, in reading order", async ({ page }) => {
    await page.goto("/contact");
    // The form streams in behind a skeleton.
    await expect(page.getByLabel(forms.fields.name)).toBeVisible();
    await page.getByLabel(contact.enquiryType).focus();

    const stops = [contact.enquiryType, ...(await tabUntil(page, contact.submit))];
    expect(stops.at(-1)).toBe(contact.submit);
    // The labelled fields come in the order they are read; the phone's two controls sit between them.
    const order = [contact.enquiryType, forms.fields.name, forms.fields.email, contact.message, contact.submit];
    expect(stops.filter((name) => order.some((label) => name.startsWith(label)))).toEqual(order);
  });
});
