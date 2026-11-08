import { describe, expect, it } from "vitest";

import {
  CONTACT_PARAMS,
  contactHref,
  contactPrefill,
  MAX_ITEM_PARAMS,
  prefillKey,
  QUOTE_PARAMS,
  quoteHref,
  quotePrefill,
} from "./prefill";

const TODAY = "2026-11-03";
const q = (query: string) => new URLSearchParams(query);

const catalogue = {
  "rental-cam": { id: "rental-cam", href: "/rentals/cam", max: 5 },
  "rental-light": { id: "rental-light", href: "/ga/rentals/light", max: 99 },
};

describe("contactPrefill", () => {
  it("reads the enquiry type", () => {
    expect(contactPrefill(q("type=Talent"))).toEqual({ enquiryType: "Talent" });
  });

  it("falls back to the first type", () => {
    expect(contactPrefill(q("type=nonsense"))).toEqual({ enquiryType: "Project" });
    expect(contactPrefill(q(""))).toEqual({ enquiryType: "Project" });
  });

  it("never reads personal details", () => {
    const prefill = contactPrefill(q("name=Aoife&email=a@b.co&message=hi&phone=1"));
    expect(JSON.stringify(prefill)).not.toMatch(/Aoife|a@b\.co|hi|\+/);
  });
});

describe("quotePrefill", () => {
  const read = (query: string) => quotePrefill(q(query), catalogue, TODAY);

  it("reads dates, company, production and items", () => {
    expect(
      read("pickup=2026-12-01&return=2026-12-03&company=Murphy+Pictures&production=Spring+shoot&item=cam:2&item=light"),
    ).toEqual({
      start: "2026-12-01",
      end: "2026-12-03",
      company: "Murphy Pictures",
      production: "Spring shoot",
      items: [
        { itemId: "rental-cam", qty: 2, max: 5 },
        { itemId: "rental-light", qty: 1, max: 99 },
      ],
    });
  });

  it("allows today, and a one-day hire", () => {
    expect(read(`pickup=${TODAY}&return=${TODAY}`)).toMatchObject({ start: TODAY, end: TODAY });
  });

  it("drops dates it couldn't submit", () => {
    expect(read("pickup=2026-11-02")).toMatchObject({ start: undefined }); // yesterday
    expect(read("pickup=2026-02-30")).toMatchObject({ start: undefined }); // not a date
    expect(read("pickup=tomorrow")).toMatchObject({ start: undefined });
    expect(read("pickup=2029-01-01")).toMatchObject({ start: undefined }); // beyond two years
    expect(read("pickup=2026-12-05&return=2026-12-01")).toMatchObject({ start: "2026-12-05", end: undefined }); // before pick-up
    expect(read("pickup=2026-12-01&return=2028-01-01")).toMatchObject({ end: undefined }); // longer than a year
    expect(read("return=2026-11-01")).toMatchObject({ end: undefined }); // in the past
  });

  it("takes a return without a pick-up if it is still ahead", () => {
    expect(read("return=2026-12-03")).toMatchObject({ start: undefined, end: "2026-12-03" });
  });

  it("clamps quantities to the item's cap, and treats a missing or odd quantity as one", () => {
    expect(read("item=cam:50").items[0]).toMatchObject({ qty: 5 });
    expect(read("item=cam:0").items[0]).toMatchObject({ qty: 1 });
    expect(read("item=cam:abc").items[0]).toMatchObject({ qty: 1 });
    expect(read("item=cam:-3").items[0]).toMatchObject({ qty: 1 });
    expect(read("item=cam").items[0]).toMatchObject({ qty: 1 });
  });

  it("ignores items that aren't in the catalogue, repeats, and anything past the cap", () => {
    expect(read("item=unknown&item=also-unknown").items).toEqual([]);
    expect(read("item=cam:2&item=cam:4").items).toEqual([{ itemId: "rental-cam", qty: 2, max: 5 }]);
    const many = `${Array.from({ length: MAX_ITEM_PARAMS + 5 }, (_, i) => `item=nothing-${i}`).join("&")}&item=cam`;
    expect(read(many).items).toEqual([]); // cam was past the cap
  });

  it("finds an item by the slug at the end of its (localised) link", () => {
    expect(read("item=light").items[0]).toMatchObject({ itemId: "rental-light" });
  });

  it("cleans free text: trimmed, no control characters, cut to the field's limit", () => {
    expect(read("company=%20%20Murphy%0A%09Pictures%20").company).toBe("MurphyPictures");
    expect(read(`company=${"x".repeat(500)}`).company).toHaveLength(120);
    expect(read("company=%20%20&production=").company).toBeUndefined();
  });

  it("never reads personal details", () => {
    const prefill = read("name=Aoife&email=a@b.co&phone=%2B353871234567&message=hi");
    expect(JSON.stringify(prefill)).not.toMatch(/Aoife|a@b\.co|353|"hi"/);
    expect(Object.keys(prefill).sort()).toEqual(["company", "end", "items", "production", "start"]);
  });
});

describe("links", () => {
  it("builds contact links, with nothing to say meaning a plain link", () => {
    expect(contactHref("en")).toBe("/contact");
    expect(contactHref("en", { type: "Talent" })).toBe("/contact?type=Talent");
  });

  it("builds quote links, leaving a quantity of one implied and encoding text", () => {
    expect(quoteHref("en")).toBe("/rentals/quote");
    expect(
      quoteHref("en", {
        start: "2026-12-01",
        end: "2026-12-03",
        company: "Murphy & Co",
        production: "Spring shoot",
        items: [
          { slug: "cam", qty: 2 },
          { slug: "light", qty: 1 },
        ],
      }),
    ).toBe(
      "/rentals/quote?pickup=2026-12-01&return=2026-12-03&company=Murphy+%26+Co&production=Spring+shoot&item=cam%3A2&item=light",
    );
  });

  it("round-trips through the readers", () => {
    const href = quoteHref("en", {
      start: "2026-12-01",
      end: "2026-12-03",
      company: "Murphy & Co",
      production: "Spring shoot",
      items: [{ slug: "cam", qty: 3 }],
    });
    const params = new URL(href, "https://fiu.test").searchParams;
    expect(quotePrefill(params, catalogue, TODAY)).toEqual({
      start: "2026-12-01",
      end: "2026-12-03",
      company: "Murphy & Co",
      production: "Spring shoot",
      items: [{ itemId: "rental-cam", qty: 3, max: 5 }],
    });
    const contact = new URL(contactHref("en", { type: "Talent" }), "https://fiu.test").searchParams;
    expect(contactPrefill(contact)).toEqual({ enquiryType: "Talent" });
  });
});

describe("prefillKey", () => {
  it("keeps only the parameters a form reads", () => {
    const params = q("type=Talent&utm_source=news&name=Aoife");
    expect(prefillKey(params, CONTACT_PARAMS)).toBe("type=Talent");
    expect(prefillKey(params, QUOTE_PARAMS)).toBe("");
  });
});
