import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { sanity } from "next-sanity/live/cache-life";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: false,
  },
  // Lets a phone on the home network load the dev server by LAN address (HMR is blocked otherwise).
  allowedDevOrigins: ["192.168.68.120", "192.168.68.*"],
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
    // Mobile hotspots (NAT64) resolve public hosts to 64:ff9b::/96, which Next treats as private.
    // Dev only, so production keeps the SSRF guard.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
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
