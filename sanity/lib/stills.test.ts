import { describe, expect, it } from "vitest";
import { MAX_HERO_STILLS, toHeroStills } from "./stills";

const still = (key: string) => ({
  _key: key,
  alt: key,
  asset: { _type: "reference" as const, _ref: `image-${key.replace(/\W/g, "")}-100x100-jpg` },
  crop: null,
  hotspot: null,
  lqip: null,
  dimensions: { _type: "sanity.imageDimensions" as const, width: 1600, height: 900, aspectRatio: 16 / 9 },
});
const project = (id: string, stills: string[], stillsMobile: string[] | null = null) => ({
  _id: id,
  stills: stills.map(still),
  stillsMobile: stillsMobile?.map(still) ?? null,
});
const alts = (stills: { alt: string }[]) => stills.map((s) => s.alt);

describe("toHeroStills", () => {
  it("takes one still from each project in turn", () => {
    const { landscape } = toHeroStills([project("a", ["a1", "a2", "a3"]), project("b", ["b1"]), project("c", ["c1", "c2"])]);
    expect(alts(landscape)).toEqual(["a1", "b1", "c1", "a2", "c2", "a3"]);
  });

  it("gives phones a project's mobile stills, or its landscape ones when it has none", () => {
    const { portrait } = toHeroStills([project("a", ["a1"], ["a-m1", "a-m2"]), project("b", ["b1"])]);
    expect(alts(portrait)).toEqual(["a-m1", "b1", "a-m2"]);
  });

  it("caps each set so every project still appears", () => {
    const many = (id: string) => Array.from({ length: 8 }, (_, i) => `${id}${i}`);
    const { landscape } = toHeroStills([project("a", many("a")), project("b", many("b")), project("c", many("c"))]);
    expect(landscape).toHaveLength(MAX_HERO_STILLS);
    expect(new Set(alts(landscape).map((a) => a[0]))).toEqual(new Set(["a", "b", "c"]));
  });

  it("links each still to its field on the project for the Presentation tool", () => {
    const { landscape, portrait } = toHeroStills([project("a", ["a1"], ["a-m1"])]);
    expect(landscape[0]!.dataSanity).toContain("id=a;type=project;path=stills:a1");
    expect(portrait[0]!.dataSanity).toContain("id=a;type=project;path=stillsMobile:a-m1");
  });

  it("skips projects that were deleted", () => {
    expect(toHeroStills([null, project("a", ["a1"])]).landscape).toHaveLength(1);
  });
});
