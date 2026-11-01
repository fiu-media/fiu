import { describe, expect, it } from "vitest";
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
});
