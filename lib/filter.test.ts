import { describe, expect, it } from "vitest";

import { selectFilter } from "./filter";

const groups = [{ slug: "film" }, { slug: "photo" }, { slug: "empty" }];
const items = [
  { id: 1, type: "film" },
  { id: 2, type: "photo" },
  { id: 3, type: "film" },
  { id: 4, type: null },
];
const by = { idOf: (group: { slug: string }) => group.slug, groupOf: (item: { type: string | null }) => item.type };

describe("selectFilter", () => {
  it("offers only the groups that have items", () => {
    expect(selectFilter(groups, items, null, by).usable).toEqual([{ slug: "film" }, { slug: "photo" }]);
  });

  it("narrows to the requested group", () => {
    const result = selectFilter(groups, items, "film", by);
    expect(result.active).toBe("film");
    expect(result.visible.map((item) => item.id)).toEqual([1, 3]);
  });

  it.each([
    ["missing", null],
    ["unknown", "nope"],
    ["a group with no items", "empty"],
    ["undefined", undefined],
  ])("shows everything for %s request", (_, requested) => {
    const result = selectFilter(groups, items, requested, by);
    expect(result.active).toBeNull();
    expect(result.visible).toEqual(items);
  });
});
