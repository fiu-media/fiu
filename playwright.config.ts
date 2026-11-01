import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Locally the Sanity project, dataset and tokens come from .env.local; CI sets them directly.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const port = 3000;
const baseURL = `http://localhost:${port}`;

// Run against a production build (`npm run build` first), reading the `dev` Sanity dataset. See README.
export default defineConfig({
  testDir: "e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: { E2E_BYPASS_BOTID: "1", PORT: String(port) },
  },
});
