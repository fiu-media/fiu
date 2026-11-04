import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { HOME_STILLS_QUERY, PROJECT_QUERY, TALENT_OPTIONS_QUERY, TALENT_PROFILE_QUERY, TALENTS_BY_ID_QUERY } from "./queries";

type Doc = Record<string, unknown>;

// The roster as the Studio stores it: the default language (en) is edited, a translation (ga) only restates the bio.
// "c" predates the `available` field and has no value for it.
const talent = (id: string, slug: string, language: string, extra: Doc = {}): Doc => ({
  _id: id,
  _type: "talent",
  language,
  name: `Person ${slug.toUpperCase()}`,
  slug: { current: slug },
  orderRank: slug,
  ...extra,
});
const dataset: Doc[] = [
  talent("a-en", "a", "en", { available: true }),
  talent("b-en", "b", "en", { available: false }),
  talent("c-en", "c", "en"),
  talent("a-ga", "a", "ga"),
  talent("b-ga", "b", "ga"),
];

async function run(query: string, params: Doc) {
  return (await evaluate(parse(query, { params }), { dataset: dataset as never, params })).get();
}

describe("talent availability", () => {
  it("offers available talent, counting one with no value as available", async () => {
    const options = (await run(TALENT_OPTIONS_QUERY, { lang: "en", fallbackLang: "en" })) as { id: string; slug: string }[];
    expect(options.map((o) => o.slug)).toEqual(["a", "c"]);
  });

  it("hides someone unavailable in every language, translated or not", async () => {
    const options = (await run(TALENT_OPTIONS_QUERY, { lang: "ga", fallbackLang: "en" })) as { id: string; slug: string }[];
    // a is translated, c falls back to the default language, b is hidden although its translation has no flag of its own.
    expect(options.map((o) => o.slug)).toEqual(["a", "c"]);
    // A contact message always references the default-language document.
    expect(options.find((o) => o.slug === "a")?.id).toBe("a-en");
  });

  it("only accepts available people by id", async () => {
    const ids = ["a-en", "b-en", "c-en", "nobody"];
    const found = (await run(TALENTS_BY_ID_QUERY, { fallbackLang: "en", ids })) as { _id: string }[];
    expect(found.map((p) => p._id).sort()).toEqual(["a-en", "c-en"]);
  });

  it("tells a profile whether the person is available, from the default-language document", async () => {
    const profile = async (slug: string, lang: string) =>
      (await run(TALENT_PROFILE_QUERY, { lang, fallbackLang: "en", slug })) as { available: boolean };
    expect((await profile("a", "en")).available).toBe(true);
    expect((await profile("b", "en")).available).toBe(false);
    expect((await profile("c", "en")).available).toBe(true);
    expect((await profile("b", "ga")).available).toBe(false);
  });
});

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
