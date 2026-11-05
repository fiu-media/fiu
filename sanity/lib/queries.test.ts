import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { HOME_STILLS_QUERY, PROJECT_QUERY } from "./queries";

type Doc = Record<string, unknown>;

describe("project page", () => {
  const still = (key: string) => ({ _key: key, asset: { _ref: `image-${key}` } });
  const project = (language: string, extra: Doc = {}): Doc => ({
    _id: `p-${language}`,
    _type: "project",
    language,
    title: language === "en" ? "Solas" : "Solas (ga)",
    slug: { current: "solas" },
    ...extra,
  });
  const projects: Doc[] = [
    project("en", {
      description: [{ _type: "block", children: [{ _type: "span", text: "English" }] }],
      credits: [{ _key: "c1", name: "Aoife Murphy" }],
      stills: [still("a")],
      stillsMobile: [still("m")],
    }),
    project("ga", { stills: [still("b")] }),
  ];
  const fetch = async (lang: string) =>
    (await (
      await evaluate(parse(PROJECT_QUERY, { params: { lang, fallbackLang: "en", slug: "solas" } }), {
        dataset: projects as never,
        params: { lang, fallbackLang: "en", slug: "solas" },
      })
    ).get()) as {
      title: string;
      description: unknown[] | null;
      credits: { name: string }[] | null;
      stills: { _key: string }[] | null;
      stillsMobile: { _key: string }[] | null;
    };

  it("inherits the description, credits and untranslated stills from the default language", async () => {
    const ga = await fetch("ga");
    expect(ga.title).toBe("Solas (ga)");
    expect(ga.description).toHaveLength(1);
    expect(ga.credits?.map((c) => c.name)).toEqual(["Aoife Murphy"]);
    expect(ga.stillsMobile?.map((s) => s._key)).toEqual(["m"]);
  });

  it("lets a translation replace the stills with its own", async () => {
    expect((await fetch("ga")).stills?.map((s) => s._key)).toEqual(["b"]);
    expect((await fetch("en")).stills?.map((s) => s._key)).toEqual(["a"]);
  });
});

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
  const fetch = async (lang: string) => {
    const params = { lang, fallbackLang: "en" };
    return (await (await evaluate(parse(HOME_STILLS_QUERY, { params }), { dataset: dataset as never, params })).get()) as {
      _id: string;
      projects: { _id: string; stills: { _key: string }[] | null; stillsMobile: { _key: string }[] | null }[];
    };
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
