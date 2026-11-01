import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", onlyIf(true, "b"))).toBe("a b");
  });

  it("lets a later class override an earlier conflicting one", () => {
    expect(cn("h-8 px-3.5", "size-10 px-0")).toBe("size-10 px-0");
    expect(cn("rounded-xl", "rounded-full")).toBe("rounded-full");
    expect(cn("h-8 px-3.5", "h-12 w-12 px-0")).toBe("h-12 w-12 px-0");
  });

  it("keeps the site's custom classes and tokens", () => {
    expect(cn("glass glass-piece glass-interactive", "glass-on-image")).toBe(
      "glass glass-piece glass-interactive glass-on-image",
    );
    expect(cn("bg-ink text-fg", "bg-bg-raised")).toBe("text-fg bg-bg-raised");
    expect(cn("text-[0.8125rem] text-fg-muted")).toBe("text-[0.8125rem] text-fg-muted");
    expect(cn("font-display font-semibold")).toBe("font-display font-semibold");
  });
});

function onlyIf(condition: boolean, value: string) {
  return condition && value;
}
