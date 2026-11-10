import { defineCliConfig } from "sanity/cli";

import { omitUndefined } from "./lib/omitUndefined";

export default defineCliConfig({
  api: {
    ...omitUndefined({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    }),
  },
  deployment: {
    // The hosted Studio at fiu.sanity.studio keeps its Sanity packages up to date. Deployed by .github/workflows/deploy-studio.yml.
    appId: "agkvpsw9a3enxck0hzkorj8p",
    autoUpdates: true,
  },
  // The site's public/ folder (stills, 3D assets) isn't part of the Studio, so don't upload it with the bundle.
  vite: (config) => ({ ...config, publicDir: false }),
  typegen: {
    path: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "sanity/lib/**/*.ts",
      "content/**/*.{ts,tsx}",
      "features/**/*.{ts,tsx}",
    ],
    schema: "sanity/extract.json",
    generates: "sanity.types.ts",
  },
});
