import "./env";

import os from "node:os";

import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
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
    // simple-icons ships all ~3,400 icons from one barrel, so only the ones imported get bundled. lucide-react is covered by Next's defaults.
    optimizePackageImports: ["simple-icons"],
  },
  // Staff sign-in is not linked from the public nav: they go to /login (or arrive from /concepts or /dashboard).
  // `/dev` was renamed to `/concepts`; keep old bookmarks working.
  redirects: () =>
    Promise.resolve([
      { source: "/login", destination: "/api/auth/google", permanent: false },
      { source: "/dev", destination: "/concepts", permanent: true },
      { source: "/dev/:path*", destination: "/concepts/:path*", permanent: true },
      { source: "/:lang(en|ga)/dev", destination: "/:lang/concepts", permanent: true },
      { source: "/:lang(en|ga)/dev/:path*", destination: "/:lang/concepts/:path*", permanent: true },
    ]),
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
