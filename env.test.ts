import { afterEach, describe, expect, it, vi } from "vitest";

const base = { NEXT_PUBLIC_SANITY_PROJECT_ID: "abc", NEXT_PUBLIC_SANITY_DATASET: "production" };

/** Loads env.ts fresh with exactly these variables, since it validates when imported. */
async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const name of ["VERCEL_ENV", "SANITY_API_WRITE_TOKEN", "RESEND_API_KEY", "QUOTE_TO_EMAIL", "NEXT_PUBLIC_SITE_URL"]) {
    vi.stubEnv(name, undefined);
  }
  for (const [name, value] of Object.entries({ ...base, ...vars })) vi.stubEnv(name, value);
  return (await import("./env")).env;
}

afterEach(() => vi.unstubAllEnvs());

describe("env", () => {
  it("requires the write token and Resend key in production", async () => {
    await expect(loadEnv({ VERCEL_ENV: "production" })).rejects.toThrow(/Invalid environment variables/);
  });

  it("accepts a complete production configuration", async () => {
    const env = await loadEnv({ VERCEL_ENV: "production", SANITY_API_WRITE_TOKEN: "sk", RESEND_API_KEY: "re_1" });
    expect(env.RESEND_API_KEY).toBe("re_1");
  });

  it.each(["preview", "development", undefined])("allows missing secrets outside production (%s)", async (vercelEnv) => {
    const env = await loadEnv(vercelEnv ? { VERCEL_ENV: vercelEnv } : {});
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it("requires the Sanity project id", async () => {
    await expect(loadEnv({ NEXT_PUBLIC_SANITY_PROJECT_ID: "" })).rejects.toThrow(/Invalid environment variables/);
  });

  it("treats empty strings as unset and rejects malformed values", async () => {
    const env = await loadEnv({ QUOTE_TO_EMAIL: "" });
    expect(env.QUOTE_TO_EMAIL).toBeUndefined();
    await expect(loadEnv({ QUOTE_TO_EMAIL: "not-an-email" })).rejects.toThrow(/Invalid environment variables/);
    await expect(loadEnv({ NEXT_PUBLIC_SITE_URL: "nope" })).rejects.toThrow(/Invalid environment variables/);
  });
});
