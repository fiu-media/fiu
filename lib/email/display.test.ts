import { describe, expect, it } from "vitest";

import { emailForDisplay } from "./display";

describe("emailForDisplay", () => {
  it("shows a punycode domain in Unicode", () => {
    expect(emailForDisplay("hello@xn--fi-ska.ie")).toBe("hello@fiú.ie");
    expect(emailForDisplay("anna@xn--exmple-cua.de")).toBe("anna@exämple.de");
  });

  it("leaves ordinary and already-Unicode addresses alone", () => {
    for (const address of ["hello@example.com", "hello@fiú.ie", "séan@example.ie"]) {
      expect(emailForDisplay(address), address).toBe(address);
    }
  });

  it("returns anything that isn't an address unchanged", () => {
    for (const value of ["", "no-at-sign", "@xn--fi-ska.ie", "a@", "a@xn--"]) {
      expect(emailForDisplay(value), value).toBe(value);
    }
  });
});
