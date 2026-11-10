import AxeBuilder from "@axe-core/playwright";
import { devices, expect, type Page, test } from "@playwright/test";

import { en } from "../lib/i18n/dictionaries/en";
import { rentalItems } from "./fixtures/data";
import { isoDateFromNow } from "./helpers";

const { quote, forms } = en;

/** The rental the deep-link tests quote: one in stock, so "Add one more" is never on offer. */
const slug = rentalItems.single.slug;

const quantities = (page: Page) => page.getByRole("textbox", { name: /^Quantity of / });

test.describe("quote deep links", () => {
  test("a link prefills the dates, company, production and kit", async ({ page }) => {
    const pickup = isoDateFromNow(14);
    const ret = isoDateFromNow(16);

    await page.goto(
      `/rentals/quote?pickup=${pickup}&return=${ret}&company=Murphy+Pictures&production=Spring+shoot&item=${slug}:99`,
    );
    await expect(page.getByLabel(quote.startDate)).toHaveValue(pickup);
    await expect(page.getByLabel(quote.endDate)).toHaveValue(ret);
    await expect(page.getByLabel(quote.company)).toHaveValue("Murphy Pictures");
    await expect(page.getByLabel(quote.production)).toHaveValue("Spring shoot");
    // The item is in the quote at no more than the cap, whatever number the link asked for.
    await expect(quantities(page)).toHaveCount(1);
    const quantity = Number(await quantities(page).first().inputValue());
    expect(quantity).toBeGreaterThanOrEqual(1);
    expect(quantity).toBeLessThan(99);
    await expect(page.getByRole("button", { name: /^Add one more / })).toBeDisabled();
  });

  test("nothing personal is read from a link", async ({ page }) => {
    await page.goto(`/rentals/quote?item=${slug}&name=Aoife&email=a%40example.com&phone=%2B353871234567&message=Hello`);
    await expect(page.getByLabel(quote.company)).toBeVisible();
    await expect(page.getByLabel(forms.fields.name)).toHaveValue("");
    await expect(page.getByLabel(forms.fields.email)).toHaveValue("");
    await expect(page.getByRole("textbox", { name: /^Phone/ })).toHaveValue("");
    await expect(page.getByLabel(quote.message)).toHaveValue("");
  });

  test("dates it couldn't submit and items it doesn't know are left out", async ({ page }) => {
    await page.goto(`/rentals/quote?item=${slug}&item=not-a-real-item&pickup=2020-01-01&return=nonsense`);
    await expect(page.getByLabel(quote.startDate)).toHaveValue("");
    await expect(page.getByLabel(quote.endDate)).toHaveValue("");
    await expect(quantities(page)).toHaveCount(1);
  });

  test("following the same link again doesn't add the item twice", async ({ page }) => {
    const link = `/rentals/quote?item=${slug}`;
    await page.goto(link);
    await expect(quantities(page)).toHaveCount(1);
    const first = await quantities(page).first().inputValue();
    await page.goto(link);
    await expect(quantities(page)).toHaveCount(1);
    await expect(quantities(page).first()).toHaveValue(first);
  });

  test("a link with no items shows the empty quote, as before", async ({ page }) => {
    await page.goto(`/rentals/quote?pickup=${isoDateFromNow(14)}`);
    await expect(page.getByText(quote.emptyBasket)).toBeVisible();
  });
});

test.describe("copy link", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the quote form with its copy button has no accessibility violations", async ({ page }) => {
    await page.goto(`/rentals/quote?pickup=${isoDateFromNow(14)}&return=${isoDateFromNow(16)}&item=${slug}`);
    await expect(page.getByRole("button", { name: quote.copyLink })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("copies a link that reopens the quote, with nothing personal in it", async ({ page, context }) => {
    const pickup = isoDateFromNow(14);
    const ret = isoDateFromNow(16);
    await page.goto(`/rentals/quote?pickup=${pickup}&return=${ret}&item=${slug}`);
    await expect(page.getByLabel(quote.company)).toBeVisible();

    await page.getByLabel(quote.company).fill("Murphy & Co");
    await page.getByLabel(quote.production).fill("Spring shoot");
    await page.getByLabel(forms.fields.name).fill("Aoife Murphy");
    await page.getByLabel(forms.fields.email).fill("aoife@example.com");
    await page.getByRole("textbox", { name: /^Phone/ }).fill("871234567");
    await page.getByLabel(quote.message).fill("Private note");
    const button = page.getByRole("button", { name: quote.copyLink });
    await button.click();
    await expect(page.getByRole("status").filter({ hasText: quote.linkCopied })).toHaveCount(1);
    // The button says so too, then goes back to what it was.
    await expect(page.getByRole("button", { name: quote.linkCopied })).toBeVisible();
    await expect(button).toBeVisible({ timeout: 5000 });

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(copied);
    expect(url.pathname).toBe("/rentals/quote");
    expect(url.searchParams.get("pickup")).toBe(pickup);
    expect(url.searchParams.get("return")).toBe(ret);
    expect(url.searchParams.get("company")).toBe("Murphy & Co");
    expect(url.searchParams.get("production")).toBe("Spring shoot");
    expect(url.searchParams.getAll("item")).toHaveLength(1);
    expect(url.searchParams.getAll("item")[0]).toMatch(new RegExp(`^${slug}(:\\d+)?$`));
    // Whatever was typed into the personal fields stays out of the link, in any form.
    for (const secret of ["Aoife", "example.com", "871234567", "Private"]) expect(copied).not.toContain(secret);

    // The link works: a fresh visitor gets the same quote.
    const other = await context.newPage();
    await other.goto(copied);
    await expect(other.getByLabel(quote.startDate)).toHaveValue(pickup);
    await expect(other.getByLabel(quote.company)).toHaveValue("Murphy & Co");
    await expect(other.getByLabel(forms.fields.name)).toHaveValue("");
  });
});

// The browser is the project's (chromium); only the phone's screen, touch and user agent are taken from the device.
const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"];
const phone = { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch };

test.describe("share link on a phone", () => {
  // A touch device that can open the share sheet offers that instead of copying.
  test.use({ ...phone, permissions: ["clipboard-read", "clipboard-write"] });

  const stub = (share: string) =>
    `(() => {
      window.__shared = [];
      window.__copied = [];
      navigator.share = async (data) => { window.__shared.push(data); ${share} };
      const original = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async (text) => { window.__copied.push(text); return original(text); };
    })();`;

  async function openQuote(page: Page, share = "") {
    await page.addInitScript(stub(share));
    await page.goto(`/rentals/quote?pickup=${isoDateFromNow(14)}&return=${isoDateFromNow(16)}&item=${slug}`);
    await expect(page.getByLabel(quote.company)).toBeVisible();
    await page.getByLabel(forms.fields.name).fill("Aoife Murphy");
    await page.getByLabel(forms.fields.email).fill("aoife@example.com");
  }

  const read = (page: Page) =>
    page.evaluate(() => ({
      shared: (window as unknown as { __shared: { url: string; title: string }[] }).__shared,
      copied: (window as unknown as { __copied: string[] }).__copied,
    }));

  test("opens the share sheet with the link, and doesn't copy", async ({ page }) => {
    await openQuote(page);
    await page.getByRole("button", { name: quote.shareLink }).click();
    await expect.poll(async () => (await read(page)).shared.length).toBe(1);
    const { shared, copied } = await read(page);
    expect(shared[0]!.title).toBe(en.quote.shareTitle);
    const url = new URL(shared[0]!.url);
    expect(url.pathname).toBe("/rentals/quote");
    expect(url.searchParams.get("pickup")).toBe(isoDateFromNow(14));
    for (const secret of ["Aoife", "example.com"]) expect(shared[0]!.url).not.toContain(secret);
    expect(copied).toEqual([]);
  });

  test("closing the share sheet is not an error", async ({ page }) => {
    await openQuote(page, 'throw new DOMException("closed", "AbortError");');
    await page.getByRole("button", { name: quote.shareLink }).click();
    await expect.poll(async () => (await read(page)).shared.length).toBe(1);
    // Nothing is announced, nothing is shown as copied or as failed.
    await expect(page.locator("p[role=status]")).toHaveText("");
    await expect(page.getByRole("button", { name: quote.shareLink })).toBeVisible();
    await expect(page.getByText(quote.linkCopyFailed)).toHaveCount(0);
    expect((await read(page)).copied).toEqual([]);
  });

  test("falls back to copying when sharing is refused", async ({ page }) => {
    await openQuote(page, 'throw new DOMException("refused", "NotAllowedError");');
    await page.getByRole("button", { name: quote.shareLink }).click();
    await expect(page.getByRole("button", { name: quote.linkCopied })).toBeVisible();
    expect((await read(page)).copied).toHaveLength(1);
  });
});
