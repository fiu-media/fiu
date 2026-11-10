import { describe, expect, it } from "vitest";

import { fallbackStills } from "@/features/home/fallback-stills";

import { toTeam } from "./mappers";

const photo = {
  alt: "The crew",
  asset: { _type: "reference" as const, _ref: "image-crew-4000x3000-jpg" },
  crop: null,
  hotspot: null,
  lqip: null,
  dimensions: { _type: "sanity.imageDimensions" as const, width: 4000, height: 3000, aspectRatio: 4 / 3 },
};

describe("toTeam", () => {
  it("uses the editors' photo, sized to the width asked for, with the heading and caption", () => {
    const team = toTeam({ teamStill: photo, teamCaption: "On set, 2026" }, "The team", 800);
    expect(team.image.alt).toBe("The crew");
    expect(team.image.width).toBe(800);
    expect(team).toMatchObject({ heading: "The team", caption: "On set, 2026" });
  });

  it("falls back to a bundled still until a photo is uploaded", () => {
    const team = toTeam({ teamStill: null, teamCaption: null }, "The team");
    expect(fallbackStills).toContain(team.image);
    expect(team.caption).toBeNull();
  });
});
