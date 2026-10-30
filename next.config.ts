import os from "node:os";
import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { sanity } from "next-sanity/live/cache-life";

/**
 * Dev only: lets a phone on the same network load the dev server (and its HMR socket) by this
 * machine's Bonjour name (`<hostname>.local`), which stays the same when the IP changes. Only that
 * name is allowed, not the IPs, so the allowlist stays as narrow as it can be.
 */
function devLanOrigins(): string[] {
  if (process.env.NODE_ENV !== "development") return [];
  const hostname = os.hostname();
  return [hostname.endsWith(".local") ? hostname : `${hostname}.local`];
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
