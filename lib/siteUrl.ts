import { env } from "@/env";

/**
 * The site's public origin, without a trailing slash: the canonical URL if one is set, else the production host, else
 * local dev. Absolute URLs in metadata, the sitemap and structured data are built on it, and Google needs the exact
 * sign-in callback registered, so `lib/auth.ts` uses it too. Server only: it reads a server variable.
 */
export const siteUrl = (
  env.NEXT_PUBLIC_SITE_URL
  ?? (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

/** `path` (starting with a slash) as an absolute URL on the site. The home page is the bare origin. */
export const absoluteUrl = (path: string) => (path === "/" ? siteUrl : `${siteUrl}${path}`);
