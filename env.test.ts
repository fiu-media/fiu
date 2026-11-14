import { afterEach, describe, expect, it, vi } from "vitest";

const base = { NEXT_PUBLIC_SANITY_PROJECT_ID: "abc", NEXT_PUBLIC_SANITY_DATASET: "production" };

/** Loads env.ts fresh with exactly these variables, since it validates when imported. */
async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const name of [
    "VERCEL_ENV",
    "SANITY_API_WRITE_TOKEN",
    "RESEND_API_KEY",
    "RESEND_EMAIL_DOMAIN",
    "NEXT_PUBLIC_SITE_URL",
    "AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "AUTH_ALLOWED_DOMAIN",
    "SITE_GATE",
  ]) {
    vi.stubEnv(name, undefined);
  }
  for (const [name, value] of Object.entries({ ...base, ...vars })) vi.stubEnv(name, value);
  return (await import("./env")).env;
}

afterEach(() => vi.unstubAllEnvs());

describe("env", () => {
  it("requires the write token and Resend settings in production", async () => {
    await expect(loadEnv({ VERCEL_ENV: "production" })).rejects.toThrow(/Invalid environment variables/);
  });

  it("accepts a complete production configuration", async () => {
    const env = await loadEnv({
      VERCEL_ENV: "production",
      SANITY_API_WRITE_TOKEN: "sk",
      RESEND_API_KEY: "re_1",
      RESEND_EMAIL_DOMAIN: "fiumedia.ie",
      AUTH_SECRET: "s".repeat(32),
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
    });
    expect(env.RESEND_EMAIL_DOMAIN).toBe("fiumedia.ie");
    expect(env.AUTH_ALLOWED_DOMAIN).toBe("xn--fi-ska.ie");
  });

  it("requires the staff sign-in settings in production, and a long enough signing key", async () => {
    const complete = {
      VERCEL_ENV: "production",
      SANITY_API_WRITE_TOKEN: "sk",
      RESEND_API_KEY: "re_1",
      RESEND_EMAIL_DOMAIN: "fiumedia.ie",
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
    };
    await expect(loadEnv(complete)).rejects.toThrow(/Invalid environment variables/);
    await expect(loadEnv({ ...complete, AUTH_SECRET: "short" })).rejects.toThrow(/Invalid environment variables/);
  });

  it("rejects an unknown SITE_GATE value", async () => {
    await expect(loadEnv({ SITE_GATE: "maybe" })).rejects.toThrow(/Invalid environment variables/);
    expect((await loadEnv({ SITE_GATE: "on" })).SITE_GATE).toBe("on");
  });

  it.each(["preview", "development", undefined])("allows missing secrets outside production (%s)", async (vercelEnv) => {
    const env = await loadEnv(vercelEnv ? { VERCEL_ENV: vercelEnv } : {});
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it("requires the Sanity project id", async () => {
    await expect(loadEnv({ NEXT_PUBLIC_SANITY_PROJECT_ID: "" })).rejects.toThrow(/Invalid environment variables/);
  });

  it("treats empty strings as unset and rejects malformed values", async () => {
    const env = await loadEnv({ RESEND_EMAIL_DOMAIN: "" });
    expect(env.RESEND_EMAIL_DOMAIN).toBeUndefined();
    await expect(loadEnv({ NEXT_PUBLIC_SITE_URL: "nope" })).rejects.toThrow(/Invalid environment variables/);
  });
});
