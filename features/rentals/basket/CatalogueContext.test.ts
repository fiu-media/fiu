import { describe, expect, it } from "vitest";

import type { CatalogueItem } from "@/content/rentalItem";
import { MAX_QTY } from "@/lib/forms/quantity";

import { itemMax } from "./CatalogueContext";

const cam: CatalogueItem = { id: "cam", name: "Alexa", brand: null, slug: "alexa", href: "/rentals/alexa", max: 4, image: null };

describe("itemMax", () => {
  it("prefers the catalogue's cap, then the fallback, then MAX_QTY", () => {
    expect(itemMax({ cam }, "cam", 9)).toBe(4);
    expect(itemMax({}, "cam", 9)).toBe(9);
    expect(itemMax({}, "cam")).toBe(MAX_QTY);
  });
});
