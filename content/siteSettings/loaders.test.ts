import { describe, expect, it, vi } from "vitest";

import type { SITE_SETTINGS_QUERY_RESULT } from "@/sanity.types";

import { toSiteSettings } from "./loaders";

// The fetch layer sets up Sanity Live, which needs the server token; the mapper under test never calls it.
vi.mock("@/sanity/lib/fetch", () => ({ fetchContent: vi.fn() }));

const settings = (extra: Partial<SITE_SETTINGS_QUERY_RESULT> = {}): SITE_SETTINGS_QUERY_RESULT => ({
  _id: "settings-en",
  slogan: null,
  sloganGloss: null,
  manifesto: null,
  contactEmail: null,
  instagram: null,
  teamCaption: null,
  rentalsIntro: null,
  quoteIntro: null,
  contactIntro: null,
  workIntro: null,
  talentIntro: null,
  aboutTagline: null,
  workTagline: null,
  talentTagline: null,
  rentalsTagline: null,
  contactTagline: null,
  aboutStill: null,
  teamStill: null,
  ...extra,
});

describe("toSiteSettings", () => {
  it("shows an internationalised email domain in Unicode", () => {
    expect(toSiteSettings(settings({ contactEmail: "hello@xn--fi-ska.ie" })).contact.email).toBe("hello@fiú.ie");
  });

  it("derives the Instagram handle and keeps the link", () => {
    const { instagram } = toSiteSettings(settings({ instagram: "https://www.instagram.com/fiumedia/" })).contact;
    expect(instagram).toEqual({ href: "https://www.instagram.com/fiumedia/", handle: "@fiumedia" });
  });

  it("reports nothing the editors haven't set", () => {
    expect(toSiteSettings(settings({ contactEmail: "", instagram: "" })).contact).toEqual({ email: null, instagram: null });
  });

  it("passes the other fields through and leaves the raw contact fields out", () => {
    const result = toSiteSettings(settings({ slogan: "Made in Ireland", contactEmail: "hello@fiu.ie" }));
    expect(result).toMatchObject({ _id: "settings-en", slogan: "Made in Ireland" });
    expect(result).not.toHaveProperty("contactEmail");
    expect(result).not.toHaveProperty("instagram");
  });
});
