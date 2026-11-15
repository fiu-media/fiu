import { describe, expect, it } from "vitest";

import { toShareImage } from "./image";

const asset = { _type: "reference" as const, _ref: "image-abc123-4000x3000-jpg" };

describe("toShareImage", () => {
  it("cuts the image to the link-preview frame, as a JPEG", () => {
    const image = toShareImage({ asset, crop: null, hotspot: null, alt: "On set" });
    expect(image).toMatchObject({ width: 1200, height: 630, alt: "On set" });
    const url = new URL(image?.url ?? "");
    expect(url.hostname).toBe("cdn.sanity.io");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ w: "1200", h: "630", fit: "crop", fm: "jpg" });
  });

  it("crops around the editor's hotspot", () => {
    const hotspot = { _type: "sanity.imageHotspot" as const, x: 0.5, y: 0.2, width: 0.4, height: 0.4 };
    const centred = toShareImage({ asset, crop: null, hotspot: null });
    const focused = toShareImage({ asset, crop: null, hotspot });
    expect(focused?.url).not.toBe(centred?.url);
  });

  it("is null without an asset, and leaves the alt out when there is none", () => {
    expect(toShareImage({ asset: null, crop: null, hotspot: null })).toBeNull();
    expect(toShareImage({ asset, crop: null, hotspot: null, alt: "" })).not.toHaveProperty("alt");
  });
});
