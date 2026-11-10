import { describe, expect, it } from "vitest";

import {
  COVER_MOBILE_WIDTH,
  COVER_WIDTH,
  projectMeta,
  STILL_FULL_WIDTH,
  STILL_THUMB_WIDTH,
  toProjectSlideData,
  toStills,
} from "./mappers";

const image = (id: string, width = 4000, height = 3000) => ({
  alt: id,
  asset: { _type: "reference" as const, _ref: `image-${id}-${width}x${height}-jpg` },
  crop: null,
  hotspot: null,
  lqip: null,
  dimensions: { _type: "sanity.imageDimensions" as const, width, height, aspectRatio: width / height },
});

describe("projectMeta", () => {
  it("joins what is set with a middle dot", () => {
    expect(projectMeta({ type: "Film", year: 2025, client: "RTÉ" })).toBe("Film · 2025 · RTÉ");
    expect(projectMeta({ type: "Film", year: null, client: "RTÉ" })).toBe("Film · RTÉ");
    expect(projectMeta({ type: null, year: null, client: null })).toBe("");
  });
});

describe("toProjectSlideData", () => {
  const project = {
    _id: "drafts.p1",
    title: "Solas",
    type: "Film",
    year: 2025,
    client: null,
    vimeoUrl: "https://vimeo.com/1",
    previewLoopUrl: null,
    cover: image("cover"),
    coverMobile: null,
  };

  it("maps the data props of a slide", () => {
    const data = toProjectSlideData(project);
    expect(data).toMatchObject({
      title: "Solas",
      meta: "Film · 2025",
      vimeoUrl: "https://vimeo.com/1",
      previewLoopUrl: null,
      mobileImage: null,
    });
    expect(data.image?.width).toBe(COVER_WIDTH);
  });

  it("makes the title clickable on the published document", () => {
    const attr = toProjectSlideData(project).titleAttribute;
    expect(attr).toContain("id=p1");
    expect(attr).toContain("type=project");
    expect(attr).toContain("path=title");
  });

  it("sizes the portrait cover for phones", () => {
    const data = toProjectSlideData({ ...project, coverMobile: image("mobile", 3000, 4000) });
    expect(data.mobileImage?.width).toBe(COVER_MOBILE_WIDTH);
  });

  it("has no image without a cover asset", () => {
    expect(toProjectSlideData({ ...project, cover: { ...image("x"), asset: null } }).image).toBeNull();
  });
});

describe("toStills", () => {
  it("pairs a thumbnail with a full-size image and drops stills without an asset", () => {
    const stills = toStills([image("a"), { ...image("b"), asset: null }, image("c")]);
    expect(stills).toHaveLength(2);
    expect(stills[0]!.thumb.width).toBe(STILL_THUMB_WIDTH);
    expect(stills[0]!.full.width).toBe(STILL_FULL_WIDTH);
  });

  it("treats a missing set as empty", () => {
    expect(toStills(null)).toEqual([]);
    expect(toStills(undefined)).toEqual([]);
  });
});
