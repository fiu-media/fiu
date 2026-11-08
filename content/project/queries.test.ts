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
