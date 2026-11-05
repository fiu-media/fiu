import { describe, expect, it } from "vitest";
import { en } from "./en";
import { ga } from "./ga";

/** Key paths in `translation` that `base` doesn't have (TypeScript doesn't catch these in nested literals). */
function unknownKeys(translation: object, base: object, path: string[] = []): string[] {
  return Object.entries(translation).flatMap(([key, value]) => {
    const here = [...path, key];
    const known = (base as Record<string, unknown>)[key];
    if (known === undefined) return [here.join(".")];
    return typeof value === "object" && value !== null && !Array.isArray(value) ? unknownKeys(value, known as object, here) : [];
  });
}

describe("the Irish dictionary", () => {
  it("only translates strings the English dictionary has", () => {
    expect(unknownKeys(ga, en)).toEqual([]);
  });
});
