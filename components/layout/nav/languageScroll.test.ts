import { describe, expect, it } from "vitest";

import { carryScroll, takeCarriedScroll } from "./languageScroll";

describe("carried scroll", () => {
  it("hands the position to the page it was left for, once", () => {
    carryScroll("/ga/about", 420);
    expect(takeCarriedScroll("/ga/about")).toBe(420);
    expect(takeCarriedScroll("/ga/about")).toBeNull();
  });

  it("ignores another page and keeps the position for the right one", () => {
    carryScroll("/ga/about", 420);
    expect(takeCarriedScroll("/ga/work")).toBeNull();
    expect(takeCarriedScroll("/ga/about")).toBe(420);
  });
});
