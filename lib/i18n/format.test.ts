import { describe, expect, it } from "vitest";
import type { Locale } from "./config";
import { format } from "./format";

describe("format", () => {
  it("fills placeholders with strings and numbers", () => {
    expect(format("Hi {name}, {count} items", { name: "Aoife", count: 3 })).toBe("Hi Aoife, 3 items");
  });

  it("fills a repeated placeholder everywhere", () => {
    expect(format("{a}{a}", { a: "x" })).toBe("xx");
  });

  it("leaves unknown placeholders as written", () => {
    expect(format("Hi {name}", {})).toBe("Hi {name}");
  });

  it("keeps a falsy value", () => {
    expect(format("{n} left", { n: 0 })).toBe("0 left");
  });

  describe("ICU messages", () => {
    const en = "{count, plural, one {# item} other {# items}} in quote";
    // Irish has five plural forms; real copy will come with /ga, these are placeholders for the rules.
    const ga = "{count, plural, one {# mhír} two {# mhír (dhá)} few {# mhír (beaga)} many {# mhír (go leor)} other {# mír}}";

    it("picks the English plural form", () => {
      expect(format(en, { count: 1 })).toBe("1 item in quote");
      expect(format(en, { count: 2 })).toBe("2 items in quote");
      expect(format(en, { count: 0 })).toBe("0 items in quote");
    });

    it("picks the Irish plural form for each category", () => {
      const render = (count: number) => format(ga, { count }, "ga" as Locale);
      expect(render(1)).toBe("1 mhír");
      expect(render(2)).toBe("2 mhír (dhá)");
      expect(render(3)).toBe("3 mhír (beaga)");
      expect(render(6)).toBe("6 mhír (beaga)");
      expect(render(7)).toBe("7 mhír (go leor)");
      expect(render(10)).toBe("10 mhír (go leor)");
      expect(render(11)).toBe("11 mír");
    });

    it("mixes plain placeholders with ICU", () => {
      expect(format("{name}: {count, plural, one {# item} other {# items}}", { name: "Aoife", count: 2 })).toBe("Aoife: 2 items");
    });

    it("leaves a literal apostrophe alone", () => {
      expect(format("{name}'s work", { name: "Aoife" })).toBe("Aoife's work");
    });

    it("returns an unparseable message as written", () => {
      expect(format("{count, plural, one {# item}", { count: 1 })).toBe("{count, plural, one {# item}");
    });
  });
});
