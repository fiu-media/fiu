import { describe, expect, it } from "vitest";

import { hasValidSession, SESSION_MAX_AGE, signSession } from "./session";

const secret = "s".repeat(32);

describe("session", () => {
  it("accepts a token it signed", async () => {
    expect(await hasValidSession(await signSession("a@xn--fi-ska.ie", secret), secret)).toBe(true);
  });

  it("rejects a token signed with another key, a tampered token and junk", async () => {
    const token = await signSession("a@xn--fi-ska.ie", secret);
    expect(await hasValidSession(token, "t".repeat(32))).toBe(false);
    const [header, payload, signature] = token.split(".");
    expect(await hasValidSession(`${header}.${payload}x.${signature}`, secret)).toBe(false);
    expect(await hasValidSession("not a token", secret)).toBe(false);
  });

  it("rejects a missing token or secret", async () => {
    expect(await hasValidSession(undefined, secret)).toBe(false);
    expect(await hasValidSession(await signSession("a@xn--fi-ska.ie", secret), undefined)).toBe(false);
  });

  it("expires after a week", async () => {
    const signed = new Date("2026-11-14T12:00:00Z");
    const token = await signSession("a@xn--fi-ska.ie", secret, signed);
    expect(await hasValidSession(token, secret, new Date(signed.getTime() + (SESSION_MAX_AGE - 60) * 1000))).toBe(true);
    expect(await hasValidSession(token, secret, new Date(signed.getTime() + (SESSION_MAX_AGE + 60) * 1000))).toBe(false);
  });

  it("rejects an unsigned token that claims an email", async () => {
    const unsigned = `${btoa('{"alg":"none"}')}.${btoa('{"email":"a@xn--fi-ska.ie"}')}.`;
    expect(await hasValidSession(unsigned, secret)).toBe(false);
  });
});
