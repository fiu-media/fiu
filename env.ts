import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Variables that must be set on a production deploy; dev and previews may leave them out. */
const requiredInProduction = process.env.VERCEL_ENV === "production" ? z.string().min(1) : z.string().min(1).optional();

/**
 * The one place configuration is read and validated. next.config.ts imports it, so a missing or
 * malformed variable fails `next build` and `next dev` up front instead of when a form is submitted.
 * Set SKIP_ENV_VALIDATION=1 to build deliberately without secrets.
 *
 * Standalone tooling (scripts/, e2e/global-teardown.ts, sanity.cli.ts, playwright.config.ts) runs
 * outside Next and keeps its own checks; NODE_ENV and CI stay as plain process.env reads.
 */
export const env = createEnv({
  server: {
    // Viewer token: live content and draft mode. Optional: published content works without it.
    SANITY_API_READ_TOKEN: z.string().min(1).optional(),
    // Editor token: form submissions are written with it, so a production deploy needs it.
    SANITY_API_WRITE_TOKEN: requiredInProduction,
    // Without it emails are logged and skipped, which is only acceptable outside production.
    RESEND_API_KEY: requiredInProduction,
    EMAIL_FROM: z.string().min(1).optional(),
    QUOTE_TO_EMAIL: z.email().optional(),
    // Set by Vercel.
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
    // Set only by the Playwright web server.
    E2E_BYPASS_BOTID: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.url().optional(),
  },
  runtimeEnv: {
    SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
    SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    QUOTE_TO_EMAIL: process.env.QUOTE_TO_EMAIL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    E2E_BYPASS_BOTID: process.env.E2E_BYPASS_BOTID,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
