import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Locally the Sanity project, dataset and tokens come from .env.local; CI sets them directly.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const port = 3000;
const baseURL = `http://localhost:${port}`;

// Runs against a production build reading the `dev` Sanity dataset. The suite makes its own content there (see
// e2e/fixtures): the server command seeds it, builds the site and starts it, and the teardown removes it. See README.
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
    command: "npm run e2e:serve",
    url: baseURL,
    // Seeding and building come first, so this waits for the whole build.
    timeout: 15 * 60_000,
    // A server that is already running was built without this run's content, so its pages wouldn't have it.
    reuseExistingServer: false,
    env: { E2E_BYPASS_BOTID: "1", PORT: String(port) },
  },
});
