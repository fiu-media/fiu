import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { TALENT_OPTIONS_QUERY, TALENT_PROFILE_QUERY, TALENTS_BY_ID_QUERY } from "./queries";

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
