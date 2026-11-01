import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root("."),
      // `server-only` throws outside React Server Components, so unit tests import a no-op instead.
      "server-only": root("test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    // Modules that import @/env validate at load time; the secret-less unit CI job needs these set.
    env: { NEXT_PUBLIC_SANITY_PROJECT_ID: "test", NEXT_PUBLIC_SANITY_DATASET: "test" },
    include: ["**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
