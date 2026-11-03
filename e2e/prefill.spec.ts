import { expect, test, type Page } from "@playwright/test";
import { en } from "../lib/i18n/dictionaries/en";
import { isoDateFromNow } from "./helpers";

const { quote } = en;

/** A rental the dev dataset has: its slug. Waits for the catalogue to render, so "none" means none, not "not yet". */
async function firstRental(page: Page) {
  await page.goto("/rentals");
  const item = page.locator('a[href^="/rentals/"]:not([href="/rentals/quote"])').first();
  try {
    await item.waitFor({ timeout: 15_000 });
  } catch {
    return null;
  }
  const href = (await item.getAttribute("href"))!;
  return { slug: href.split("/").pop()!.split("?")[0]! };
}

const quantities = (page: Page) => page.getByRole("group", { name: /^Quantity of / }).locator("output");

test.describe("quote deep links", () => {
  test("a link prefills the dates, company, production and kit", async ({ page }) => {
    const rental = await firstRental(page);
    test.skip(!rental, "No rental items in this dataset");
    const pickup = isoDateFromNow(14);
    const ret = isoDateFromNow(16);

    await page.goto(
      `/rentals/quote?pickup=${pickup}&return=${ret}&company=Murphy+Pictures&production=Spring+shoot&item=${rental!.slug}:99`,
    );
    await expect(page.getByLabel(quote.startDate)).toHaveValue(pickup);
    await expect(page.getByLabel(quote.endDate)).toHaveValue(ret);
    await expect(page.getByLabel(quote.company)).toHaveValue("Murphy Pictures");
    await expect(page.getByLabel(quote.production)).toHaveValue("Spring shoot");
    // The item is in the quote at no more than the cap, whatever number the link asked for.
    await expect(quantities(page)).toHaveCount(1);
    const quantity = Number(await quantities(page).first().innerText());
    expect(quantity).toBeGreaterThanOrEqual(1);
    expect(quantity).toBeLessThan(99);
    await expect(page.getByRole("button", { name: /^Add one more / })).toBeDisabled();
  });

  test("nothing personal is read from a link", async ({ page }) => {
    const rental = await firstRental(page);
    test.skip(!rental, "No rental items in this dataset");
    await page.goto(`/rentals/quote?item=${rental!.slug}&name=Aoife&email=a%40example.com&phone=%2B353871234567&message=Hello`);
    await expect(page.getByLabel(quote.company)).toBeVisible();
    await expect(page.getByLabel(quote.name)).toHaveValue("");
    await expect(page.getByLabel(quote.email)).toHaveValue("");
    await expect(page.getByRole("textbox", { name: /^Phone/ })).toHaveValue("");
    await expect(page.getByLabel(quote.message)).toHaveValue("");
  });

  test("dates it couldn't submit and items it doesn't know are left out", async ({ page }) => {
    const rental = await firstRental(page);
    test.skip(!rental, "No rental items in this dataset");
    await page.goto(`/rentals/quote?item=${rental!.slug}&item=not-a-real-item&pickup=2020-01-01&return=nonsense`);
    await expect(page.getByLabel(quote.startDate)).toHaveValue("");
    await expect(page.getByLabel(quote.endDate)).toHaveValue("");
    await expect(quantities(page)).toHaveCount(1);
  });

  test("following the same link again doesn't add the item twice", async ({ page }) => {
    const rental = await firstRental(page);
    test.skip(!rental, "No rental items in this dataset");
    const link = `/rentals/quote?item=${rental!.slug}`;
    await page.goto(link);
    await expect(quantities(page)).toHaveCount(1);
    const first = await quantities(page).first().innerText();
    await page.goto(link);
    await expect(quantities(page)).toHaveCount(1);
    await expect(quantities(page).first()).toHaveText(first);
  });

  test("a link with no items shows the empty quote, as before", async ({ page }) => {
    await page.goto(`/rentals/quote?pickup=${isoDateFromNow(14)}`);
    await expect(page.getByText(quote.emptyBasket)).toBeVisible();
  });
});

test.describe("copy link", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies a link that reopens the quote, with nothing personal in it", async ({ page, context }) => {
    const rental = await firstRental(page);
    test.skip(!rental, "No rental items in this dataset");
    const pickup = isoDateFromNow(14);
    const ret = isoDateFromNow(16);
    await page.goto(`/rentals/quote?pickup=${pickup}&return=${ret}&item=${rental!.slug}`);
    await expect(page.getByLabel(quote.company)).toBeVisible();

    await page.getByLabel(quote.company).fill("Murphy & Co");
    await page.getByLabel(quote.production).fill("Spring shoot");
    await page.getByLabel(quote.name).fill("Aoife Murphy");
    await page.getByLabel(quote.email).fill("aoife@example.com");
    await page.getByRole("textbox", { name: /^Phone/ }).fill("871234567");
    await page.getByLabel(quote.message).fill("Private note");
    await page.getByRole("button", { name: quote.copyLink }).click();
    await expect(page.getByRole("status").filter({ hasText: quote.linkCopied })).toHaveCount(1);

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(copied);
    expect(url.pathname).toBe("/rentals/quote");
    expect(url.searchParams.get("pickup")).toBe(pickup);
    expect(url.searchParams.get("return")).toBe(ret);
    expect(url.searchParams.get("company")).toBe("Murphy & Co");
    expect(url.searchParams.get("production")).toBe("Spring shoot");
    expect(url.searchParams.getAll("item")).toHaveLength(1);
    expect(url.searchParams.getAll("item")[0]).toMatch(new RegExp(`^${rental!.slug}(:\\d+)?$`));
    // Whatever was typed into the personal fields stays out of the link, in any form.
    for (const secret of ["Aoife", "example.com", "871234567", "Private"]) expect(copied).not.toContain(secret);

    // The link works: a fresh visitor gets the same quote.
    const other = await context.newPage();
    await other.goto(copied);
    await expect(other.getByLabel(quote.startDate)).toHaveValue(pickup);
    await expect(other.getByLabel(quote.company)).toHaveValue("Murphy & Co");
    await expect(other.getByLabel(quote.name)).toHaveValue("");
  });
});
