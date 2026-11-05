import { describe, expect, it } from "vitest";
import { caretWithDigitsAfter, formatPhone, initial, interpret } from "./phone";

describe("interpret", () => {
  it("reads an Irish number however it is written, to the same number", () => {
    const written = [
      "083 123 4567",
      "0831234567",
      "83 123 4567",
      "831234567",
      "(083) 123-4567",
      "+353 83 123 4567",
      "+353831234567",
      "+353 0 83 123 4567",
      "00353 83 123 4567",
    ];
    for (const text of written) {
      expect(interpret(text, "IE"), text).toEqual({ country: "IE", shown: "(83) 123 4567", e164: "+353831234567" });
    }
  });

  it("sets the first group of an Irish number in brackets once there is more after it", () => {
    expect(interpret("83", "IE").shown).toBe("83");
    expect(interpret("831", "IE").shown).toBe("(83) 1");
    expect(interpret("1 234 5678", "IE").shown).toBe("(1) 234 5678");
    expect(interpret("1800 123 456", "IE").shown).toBe("1800 123 456");
  });

  it("reads landlines: Dublin's 01, and the longer area codes", () => {
    for (const text of ["01 234 5678", "(01) 234 5678", "+353 (0)1 234 5678", "+353 (1) 234 5678"]) {
      expect(interpret(text, "IE"), text).toMatchObject({ shown: "(1) 234 5678", e164: "+35312345678" });
    }
    expect(interpret("021 456 7890", "IE")).toMatchObject({ shown: "(21) 456 7890", e164: "+353214567890" });
    expect(interpret("091 234567", "IE")).toMatchObject({ shown: "(91) 234 567", e164: "+35391234567" });
  });

  it("shows neither the dialling code nor the trunk 0, since the field shows the code", () => {
    expect(interpret("+44 20 7183 8750", "GB").shown).toBe("20 7183 8750");
    expect(interpret("020 7183 8750", "GB").shown).toBe("20 7183 8750");
    // A country with no trunk prefix: nothing to drop, the leading digit is part of the number.
    expect(interpret("(213) 373-4253", "US")).toMatchObject({ shown: "213 373 4253", e164: "+12133734253" });
  });

  it("moves to the country an international number belongs to", () => {
    expect(interpret("+44 20 7183 8750", "IE")).toMatchObject({ country: "GB", e164: "+442071838750" });
    expect(interpret("+1 213 373 4253", "IE")).toMatchObject({ country: "US", e164: "+12133734253" });
  });

  it("leaves a half-typed international prefix alone", () => {
    for (const text of ["+", "+3", "00", "+35"]) {
      expect(interpret(text, "IE"), text).toMatchObject({ shown: text, e164: "" });
    }
  });

  it("keeps a lone trunk 0 visible until a digit follows, and stores nothing for it", () => {
    expect(interpret("0", "IE")).toEqual({ country: "IE", shown: "0", e164: "" });
    expect(interpret("08", "IE")).toMatchObject({ shown: "8", e164: "+3538" });
  });

  it("is empty for nothing, and ignores letters", () => {
    expect(interpret("", "IE")).toEqual({ country: "IE", shown: "", e164: "" });
    expect(interpret("call me", "IE")).toMatchObject({ e164: "" });
  });
});

describe("initial", () => {
  it("splits a stored number into its country and the text to show", () => {
    expect(initial("+353831234567", "GB")).toEqual({ country: "IE", text: "(83) 123 4567" });
  });

  it("falls back to the default country for nothing or for something unparseable", () => {
    expect(initial("", "IE")).toEqual({ country: "IE", text: "" });
    expect(initial("nonsense", "IE")).toEqual({ country: "IE", text: "" });
  });
});

describe("formatPhone", () => {
  it("writes an Irish number with its first group in brackets", () => {
    expect(formatPhone("+353831234567")).toBe("+353 (83) 123 4567");
    expect(formatPhone("+35312345678")).toBe("+353 (1) 234 5678");
  });

  it("leaves other countries' numbers as libphonenumber groups them", () => {
    expect(formatPhone("+442071838750")).toBe("+44 20 7183 8750");
  });

  it("returns what it can't read as it was", () => {
    expect(formatPhone("call me")).toBe("call me");
    expect(formatPhone("")).toBe("");
  });
});

describe("caretWithDigitsAfter", () => {
  it("finds the position that keeps the same digits after the caret", () => {
    expect(caretWithDigitsAfter("83 123 4567", 0)).toBe(11);
    expect(caretWithDigitsAfter("83 123 4567", 4)).toBe(7);
    expect(caretWithDigitsAfter("83 123 4567", 9)).toBe(0);
  });
});
