import { expect, test, type Locator, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { isoDateFromNow } from "./helpers";

const { contact, quote } = en;

// A textarea's height in lines is its height less the padding (1.5rem) and border (2px), over the line height.
const lines = (box: Locator) =>
  box.evaluate((el) => {
    const style = getComputedStyle(el);
    const chrome =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth);
    return {
      lines: (el.getBoundingClientRect().height - chrome) / parseFloat(style.lineHeight),
      height: el.getBoundingClientRect().height,
      scrolls: el.scrollHeight > el.clientHeight + 1,
    };
  });

const text = (count: number) => Array.from({ length: count }, (_, i) => `Line ${i + 1}`).join("\n");

async function contactMessage(page: Page) {
  await page.goto("/contact");
  const box = page.getByLabel(contact.message);
  await expect(box).toBeVisible();
  return box;
}

test.describe("textarea sizing", () => {
  test("the contact message starts six lines tall, with room to write", async ({ page }) => {
    const box = await contactMessage(page);
    expect((await lines(box)).lines).toBeCloseTo(6, 0);
  });

  test("it grows with what is typed, without scrolling, up to its limit", async ({ page }) => {
    const box = await contactMessage(page);
    await box.fill(text(10));
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(10, 0);
    expect((await lines(box)).scrolls).toBe(false);
  });

  test("past sixteen lines it stops growing and scrolls inside", async ({ page }) => {
    const box = await contactMessage(page);
    await box.fill(text(40));
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(16, 0);
    expect((await lines(box)).scrolls).toBe(true);
  });

  test("it shrinks back when the text goes", async ({ page }) => {
    const box = await contactMessage(page);
    await box.fill(text(14));
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(14, 0);
    await box.fill("Short.");
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(6, 0);
  });

  test("it never takes more than 60% of a short screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    const box = await contactMessage(page);
    await box.fill(text(40));
    await expect.poll(async () => (await lines(box)).height).toBeLessThanOrEqual(500 * 0.6 + 1);
    expect((await lines(box)).scrolls).toBe(true);
  });

  test("the handle moves the bottom edge only, never the width", async ({ page }) => {
    const box = await contactMessage(page);
    expect(await box.evaluate((el) => getComputedStyle(el).resize)).toBe("vertical");
  });

  test("the optional quote note starts smaller, and stops sooner", async ({ page }) => {
    await page.goto("/rentals");
    const item = page.locator('a[href^="/rentals/"]:not([href="/rentals/quote"])').first();
    await item.waitFor({ timeout: 15_000 });
    const slug = (await item.getAttribute("href"))!.split("/").pop()!;
    await page.goto(`/rentals/quote?pickup=${isoDateFromNow(14)}&return=${isoDateFromNow(16)}&item=${slug}`);
    const box = page.getByLabel(quote.message);
    await expect(box).toBeVisible();
    expect((await lines(box)).lines).toBeCloseTo(3, 0);
    await box.fill(text(40));
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(10, 0);
  });
});

test.describe("textarea sizing without field-sizing", () => {
  // Emulates a browser without CSS `field-sizing`: the script that stands in for it must do the same job.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = ((property: string, value?: string) =>
        property === "field-sizing"
          ? false
          : value === undefined
            ? supports(property)
            : supports(property, value)) as typeof CSS.supports;
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "textarea { field-sizing: fixed !important; }";
        document.head.append(style);
      });
    });
  });

  test("grows, stops at its limit, and shrinks back", async ({ page }) => {
    const box = await contactMessage(page);
    // The CSS way of growing is off here, so it is the script that does the growing below.
    expect(await box.evaluate((el) => getComputedStyle(el).getPropertyValue("field-sizing"))).toBe("fixed");
    expect((await lines(box)).lines).toBeCloseTo(6, 0);
    await box.fill(text(10));
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(10, 0);
    await box.fill(text(40));
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(16, 0);
    expect((await lines(box)).scrolls).toBe(true);
    await box.fill("Short.");
    await expect.poll(async () => (await lines(box)).lines).toBeCloseTo(6, 0);
  });
});
