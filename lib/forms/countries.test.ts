import { describe, expect, it } from "vitest";
import { countryList } from "./countries";

describe("countryList", () => {
  it("names the countries in Irish, files them without their article, and pins Ireland, the UK and the US", () => {
    const { pinned, all } = countryList("ga");
    expect(pinned.map((c) => c.code)).toEqual(["IE", "GB", "US"]);
    expect(pinned[0].name).toBe("Éire");
    const names = all.map((c) => c.name);
    expect(names).toContain("an Fhrainc");
    expect(names.indexOf("an Fhrainc")).toBeLessThan(names.indexOf("an Ghearmáin"));
    expect(all.map((c) => c.code)).not.toContain("IE");
  });

  it("names them in English for the English site", () => {
    const { pinned, all } = countryList("en");
    expect(pinned.map((c) => c.name)).toEqual(["Ireland", "United Kingdom", "United States"]);
    expect(all.find((c) => c.code === "FR")?.name).toBe("France");
  });
});
