import { describe, expect, it } from "vitest";

import { domainToAscii, isEmailAddress, toDeliverable } from "./address";

describe("isEmailAddress", () => {
  it("accepts ordinary addresses", () => {
    for (const address of ["a@b.co", "aoife.o'brien+work@example.ie", "a-b_c@sub.example.com", "x@xn--exmple-cua.de"]) {
      expect(isEmailAddress(address), address).toBe(true);
    }
  });

  it("accepts accented local parts and internationalised domains", () => {
    for (const address of ["séan@example.ie", "Seán.Ó.Súilleabháin@example.ie", "müller@exämple.de", "用户@例子.广告"]) {
      expect(isEmailAddress(address), address).toBe(true);
    }
  });

  it("rejects what isn't an address", () => {
    const bad = [
      "",
      "nope",
      "a@",
      "@b.co",
      "a@b",
      "a@localhost",
      "a@1.2.3.4",
      "a b@c.com",
      " a@b.co",
      "a@b.co\n",
      "a@@b.co",
      "a..b@c.com",
      ".a@c.com",
      "a.@c.com",
      "<a>@c.com",
      'a"b@c.com',
      "a@b..co",
      "a@-b.co",
      `${"x".repeat(65)}@example.com`,
    ];
    for (const address of bad) expect(isEmailAddress(address), JSON.stringify(address)).toBe(false);
  });

  it("measures the local part in bytes, as the limit is", () => {
    expect(isEmailAddress(`${"é".repeat(32)}@example.com`)).toBe(true);
    expect(isEmailAddress(`${"é".repeat(33)}@example.com`)).toBe(false);
  });
});

describe("domainToAscii", () => {
  it("converts to punycode and lower-cases", () => {
    expect(domainToAscii("exämple.de")).toBe("xn--exmple-cua.de");
    expect(domainToAscii("Example.COM")).toBe("example.com");
  });
});

describe("toDeliverable", () => {
  it("passes ASCII addresses through", () => {
    expect(toDeliverable("studio@example.com")).toBe("studio@example.com");
  });

  it("writes an internationalised domain as punycode", () => {
    expect(toDeliverable("anna@exämple.de")).toBe("anna@xn--exmple-cua.de");
  });

  it("has no deliverable form for an accented local part", () => {
    expect(toDeliverable("séan@example.ie")).toBeNull();
    expect(toDeliverable("séan@exämple.ie")).toBeNull();
  });

  it("returns null for something that isn't an address", () => {
    expect(toDeliverable("nope")).toBeNull();
  });
});
