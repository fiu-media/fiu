import { describe, expect, it } from "vitest";

import { isAllowedAccount, normaliseDomain, safeNext } from "./google";

const ok = { email: "sam@xn--fi-ska.ie", email_verified: true, hd: "xn--fi-ska.ie" };

describe("isAllowedAccount", () => {
  it("accepts a verified account in the domain", () => {
    expect(isAllowedAccount(ok, "xn--fi-ska.ie")).toBe(true);
  });

  it("treats fiú.ie and xn--fi-ska.ie as the same domain, in any case", () => {
    expect(isAllowedAccount(ok, "fiú.ie")).toBe(true);
    expect(isAllowedAccount({ ...ok, email: "Sam@FIÚ.ie", hd: "fiú.ie" }, "XN--FI-SKA.IE")).toBe(true);
  });

  it("rejects an account in another Workspace, or a personal one with no hd", () => {
    expect(isAllowedAccount({ ...ok, hd: "example.com" }, "xn--fi-ska.ie")).toBe(false);
    expect(isAllowedAccount({ email: "sam@gmail.com", email_verified: true }, "xn--fi-ska.ie")).toBe(false);
  });

  it("rejects an address Google hasn't verified", () => {
    expect(isAllowedAccount({ ...ok, email_verified: false }, "xn--fi-ska.ie")).toBe(false);
    expect(isAllowedAccount({ ...ok, email_verified: "true" }, "xn--fi-ska.ie")).toBe(false);
  });

  it.each([
    "sam@xn--fi-ska.ie.evil.com",
    "sam@evil-xn--fi-ska.ie",
    "sam@sub.xn--fi-ska.ie",
    "xn--fi-ska.ie",
    "@xn--fi-ska.ie",
    "sam@evil.com@xn--fi-ska.ie",
  ])("rejects the look-alike address %s even with a matching hd", (email) => {
    expect(isAllowedAccount({ ...ok, email }, "xn--fi-ska.ie")).toBe(false);
  });

  it("rejects claims that are missing or not strings", () => {
    expect(isAllowedAccount({}, "xn--fi-ska.ie")).toBe(false);
    expect(isAllowedAccount({ ...ok, email: 42 }, "xn--fi-ska.ie")).toBe(false);
    expect(isAllowedAccount(ok, "")).toBe(false);
  });
});

describe("normaliseDomain", () => {
  it("lower-cases, trims and converts to punycode", () => {
    expect(normaliseDomain(" FIÚ.ie ")).toBe("xn--fi-ska.ie");
  });
});

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/dev/specimen?x=1")).toBe("/dev/specimen?x=1");
    expect(safeNext("/")).toBe("/");
  });

  it.each([null, "", "dev", "https://evil.com", "//evil.com", "/\\evil.com"])("falls back to the home page for %s", (value) => {
    expect(safeNext(value)).toBe("/");
  });
});
