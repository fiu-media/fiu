import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";

import { HOME_STILLS_QUERY, SITE_SETTINGS_QUERY } from "./queries";

type Doc = Record<string, unknown>;

describe("home stills", () => {
  const still = (key: string) => ({ _key: key, asset: { _ref: `image-${key}` } });
  const project = (id: string, slug: string, language: string, extra: Doc = {}): Doc => ({
    _id: id,
    _type: "project",
    language,
    slug: { current: slug },
    ...extra,
  });
  const dataset: Doc[] = [
    { _id: "settings-en", _type: "siteSettings", language: "en", homeProjects: [{ _ref: "b-en" }, { _ref: "a-en" }] },
    { _id: "settings-ga", _type: "siteSettings", language: "ga" },
    project("a-en", "a", "en", { stills: [still("a1")], stillsMobile: [still("a-m")] }),
    project("b-en", "b", "en", { stills: [still("b1"), still("b2")] }),
    project("a-ga", "a", "ga", { stills: [still("a-ga1")] }),
  ];
  // groq-js returns `any`; the annotation says which fields these tests read.
  type Result = {
    _id: string;
    projects: { _id: string; stills: { _key: string }[] | null; stillsMobile: { _key: string }[] | null }[];
  };
  const fetch = async (lang: string): Promise<Result> => {
    const params = { lang, fallbackLang: "en" };
    return (await evaluate(parse(HOME_STILLS_QUERY, { params }), { dataset, params })).get();
  };

  it("lists the referenced projects' stills in the editors' order", async () => {
    const { projects } = await fetch("en");
    expect(projects.map((p) => p._id)).toEqual(["b-en", "a-en"]);
    expect(projects[0]!.stills?.map((s) => s._key)).toEqual(["b1", "b2"]);
    expect(projects[0]!.stillsMobile).toBeNull();
    expect(projects[1]!.stillsMobile?.map((s) => s._key)).toEqual(["a-m"]);
  });

  it("uses a translation's stills where it has them, and the default language's where it has not", async () => {
    // The language without home projects of its own shows the default language's, with each project's stills translated.
    const { projects } = await fetch("ga");
    expect(projects.map((p) => p.stills?.map((s) => s._key))).toEqual([["b1", "b2"], ["a-ga1"]]);
    // The translation has no mobile stills of its own, so the default language's show.
    expect(projects[1]!.stillsMobile?.map((s) => s._key)).toEqual(["a-m"]);
  });
});

describe("site settings", () => {
  const image = (ref: string) => ({ alt: ref, asset: { _ref: ref } });
  const dataset: Doc[] = [
    {
      _id: "settings-en",
      _type: "siteSettings",
      language: "en",
      slogan: "Made in Ireland",
      contactEmail: "hello@fiu.ie",
      instagram: "https://www.instagram.com/fiumedia/",
      workIntro: "Our work",
      aboutStill: image("image-en-about"),
      teamStill: image("image-en-team"),
    },
    {
      _id: "settings-ga",
      _type: "siteSettings",
      language: "ga",
      slogan: "Déanta in Éirinn",
      // A translation with an image object but no asset (the editors cleared it) shows the default language's.
      aboutStill: { alt: "cleared" },
      teamStill: image("image-ga-team"),
    },
  ];
  // groq-js returns `any`; the annotation says which fields these tests read.
  type Result = Doc & { aboutStill: { alt: string } | null; teamStill: { alt: string } | null };
  const fetch = async (lang: string): Promise<Result> => {
    const params = { lang, fallbackLang: "en" };
    return (await evaluate(parse(SITE_SETTINGS_QUERY, { params }), { dataset, params })).get();
  };

  it("reads the document in the requested language", async () => {
    const settings = await fetch("en");
    expect(settings).toMatchObject({ _id: "settings-en", slogan: "Made in Ireland", workIntro: "Our work" });
    expect(settings.aboutStill?.alt).toBe("image-en-about");
  });

  it("falls back to the default language field by field", async () => {
    const settings = await fetch("ga");
    expect(settings).toMatchObject({
      _id: "settings-ga",
      slogan: "Déanta in Éirinn",
      contactEmail: "hello@fiu.ie",
      instagram: "https://www.instagram.com/fiumedia/",
      workIntro: "Our work",
    });
    // Fields neither language sets come back null, so the loader's types hold.
    expect(settings.talentIntro).toBeNull();
  });

  it("falls back to the default language's image only when the translation has no asset", async () => {
    const settings = await fetch("ga");
    expect(settings.aboutStill?.alt).toBe("image-en-about");
    expect(settings.teamStill?.alt).toBe("image-ga-team");
  });

  it("uses the default language's document when the language has none", async () => {
    const settings = await fetch("fr");
    expect(settings._id).toBe("settings-en");
    expect(settings.slogan).toBe("Made in Ireland");
  });
});
