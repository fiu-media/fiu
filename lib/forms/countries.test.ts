import { describe, expect, it } from "vitest";
import { countryNames } from "./countries";

const nameOf = (lang: "en" | "ga", code: string) => countryNames(lang).find((c) => c.code === code)?.name;
const position = (lang: "en" | "ga", code: string) => countryNames(lang).findIndex((c) => c.code === code);

describe("countryNames", () => {
  it("names every country in the page's language", () => {
    expect(nameOf("en", "IE")).toBe("Ireland");
    expect(nameOf("ga", "IE")).toBe("Éire");
    expect(nameOf("ga", "US")).toBe("Stáit Aontaithe Mheiriceá");
  });

  it("capitalises Irish names that lead with the article", () => {
    expect(nameOf("ga", "FR")).toBe("An Fhrainc");
    expect(nameOf("ga", "BS")).toBe("Na Bahámaí");
  });

  it("leaves no country unnamed", () => {
    for (const lang of ["en", "ga"] as const) {
      for (const { code, name } of countryNames(lang)) expect(name, `${lang} ${code}`).not.toBe(code);
    }
  });

  it("sorts Irish names by the name, not the article or its mutation", () => {
    // By whole name these would all sit under A; by the name they fall under E, F, G.
    expect(position("ga", "CH")).toBeLessThan(position("ga", "FR")); // An Eilvéis
    expect(position("ga", "FR")).toBeLessThan(position("ga", "DE")); // An Ghearmáin
    expect(position("ga", "CN")).toBeGreaterThan(position("ga", "DE")); // An tSín (S, not T)
    expect(position("ga", "CN")).toBeLessThan(position("ga", "TR")); // An Tuirc
  });
});
