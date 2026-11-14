import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";

import { PROJECT_QUERY } from "./queries";

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
  // groq-js returns `any`; the annotation says which fields these tests read.
  type Result = {
    title: string;
    description: unknown[] | null;
    credits: { name: string }[] | null;
    stills: { landscape: { _key: string }[]; portrait: { _key: string }[] };
  };
  const fetch = async (lang: string): Promise<Result> =>
    (
      await evaluate(parse(PROJECT_QUERY, { params: { lang, fallbackLang: "en", slug: "solas" } }), {
        dataset: projects,
        params: { lang, fallbackLang: "en", slug: "solas" },
      })
    ).get();

  it("inherits the description, credits and untranslated stills from the default language", async () => {
    const ga = await fetch("ga");
    expect(ga.title).toBe("Solas (ga)");
    expect(ga.description).toHaveLength(1);
    expect(ga.credits?.map((c) => c.name)).toEqual(["Aoife Murphy"]);
    expect(ga.stills.portrait.map((s) => s._key)).toEqual(["m"]);
  });

  it("lets a translation replace the stills with its own", async () => {
    expect((await fetch("ga")).stills.landscape.map((s) => s._key)).toEqual(["b"]);
    expect((await fetch("en")).stills.landscape.map((s) => s._key)).toEqual(["a"]);
  });
});
