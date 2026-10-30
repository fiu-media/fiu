import os from "node:os";
import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { sanity } from "next-sanity/live/cache-life";

/**
 * Dev only: lets a phone on the same network load the dev server (and its HMR socket) by this
 * machine's own names, so nothing needs editing when the IP changes. Prefer the stable
 * `<hostname>.local` address on the phone; the current IPs are listed for when that doesn't resolve.
 */
function devLanOrigins(): string[] {
  if (process.env.NODE_ENV !== "development") return [];
  const addresses = Object.values(os.networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);
  return [os.hostname(), ...addresses];
}

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: devLanOrigins(),
  experimental: {
    agentFeedback: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Sanity Live invalidates by tag, so cached content never needs to expire on a timer.
    default: sanity,
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withBotId(nextConfig);
