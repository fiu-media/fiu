import { describe, expect, it } from "vitest";

import { MAX_QTY } from "@/lib/forms/quantity";

import { RENTAL_ITEM_IDENTITY } from "./groq";

describe("RENTAL_ITEM_IDENTITY", () => {
  // The quote action and the basket read `maxQuantity` as always set; the query is what makes that true.
  it("caps an item with no cap of its own at MAX_QTY", () => {
    expect(RENTAL_ITEM_IDENTITY).toMatch(new RegExp(String.raw`"maxQuantity": coalesce\(.*, maxQuantity, ${MAX_QTY}\)`));
  });
});
