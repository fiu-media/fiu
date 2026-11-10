import { describe, expect, it } from "vitest";

import { MAX_QTY } from "@/lib/forms/quantity";

import { toCatalogue, toQuoteCatalogue, toRentalItem } from "./mappers";

const image = (id: string, width = 4000, height = 3000) => ({
  alt: id,
  asset: { _type: "reference" as const, _ref: `image-${id}-${width}x${height}-jpg` },
  crop: null,
  hotspot: null,
  lqip: null,
});
const withDimensions = (id: string) => ({
  ...image(id),
  _key: id,
  dimensions: { _type: "sanity.imageDimensions" as const, width: 4000, height: 3000, aspectRatio: 4 / 3 },
});

const item = {
  _id: "drafts.cam-en",
  baseId: "drafts.cam-en",
  name: "Alexa Mini",
  brand: "ARRI",
  maxQuantity: 3,
  slug: "alexa-mini",
  summary: "A camera.",
  keyFeatures: ["Compact"],
  category: { _id: "cat", title: "Cameras", slug: "cameras" },
  images: [withDimensions("a"), withDimensions("b")],
};

describe("toCatalogue", () => {
  it("makes one card per item, with the published id and the first image", () => {
    const { categories, cards } = toCatalogue({
      categories: [{ _id: "c", title: "Cameras", slug: "cameras" }],
      items: [item, { ...item, baseId: "lamp", slug: "lamp", brand: null, category: null as never, images: null }],
    });
    expect(categories).toEqual([{ id: "cameras", title: "Cameras" }]);
    expect(cards[0]).toMatchObject({ id: "cam-en", slug: "alexa-mini", categoryId: "cameras", brand: "ARRI" });
    expect(cards[0]?.image?.width).toBe(800);
    expect(cards[1]).toMatchObject({ id: "lamp", categoryId: null, image: null });
  });
});

describe("toRentalItem", () => {
  const full = { ...item, specs: [{ _key: "k1", key: "Sensor", value: "S35" }], includedInKit: ["Battery"] };

  it("is null when there is no item", () => {
    expect(toRentalItem(null)).toBeNull();
  });

  it("turns missing lists into empty ones and keys the specs", () => {
    const view = toRentalItem({ ...full, keyFeatures: null, specs: null, includedInKit: null, images: null });
    expect(view).toMatchObject({ features: [], specs: [], kit: [], images: [] });
  });

  it("maps what is there", () => {
    const view = toRentalItem(full);
    expect(view).toMatchObject({
      id: "cam-en",
      categoryTitle: "Cameras",
      maxQuantity: 3,
      features: ["Compact"],
      kit: ["Battery"],
      specs: [{ key: "k1", term: "Sensor", detail: "S35" }],
    });
    expect(view?.images).toHaveLength(2);
    expect(view?.images[0]?.width).toBe(1400);
  });
});

describe("toQuoteCatalogue", () => {
  const row = { _id: "x", baseId: "cam", name: "Alexa", brand: null, maxQuantity: 4, slug: "alexa", image: image("a") };

  it("keys entries by the basket's id and carries the slug and a localised link", () => {
    const catalogue = toQuoteCatalogue("en", [row]);
    expect(catalogue.cam).toMatchObject({ id: "cam", slug: "alexa", href: "/rentals/alexa", max: 4 });
    expect(catalogue.cam?.image?.width).toBe(160);
    expect(toQuoteCatalogue("ga", [row]).cam?.href).toBe("/ga/rentals/alexa");
  });

  it("caps an item with no cap of its own at MAX_QTY and allows no image", () => {
    const catalogue = toQuoteCatalogue("en", [{ ...row, maxQuantity: null as never, image: null }]);
    expect(catalogue.cam).toMatchObject({ max: MAX_QTY, image: null });
  });
});
