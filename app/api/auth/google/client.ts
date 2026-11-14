import { Google } from "arctic";
import type { NextRequest } from "next/server";

import { env } from "@/env";

/** Cookies that carry the OAuth state and PKCE verifier from the redirect to Google back to the callback. */
export const STATE_COOKIE = "fiu-oauth-state";
export const VERIFIER_COOKIE = "fiu-oauth-verifier";
export const NEXT_COOKIE = "fiu-oauth-next";
/** How long a sign-in attempt can take, in seconds. */
const ATTEMPT_MAX_AGE = 600;

/** Google needs the exact callback URL registered, so it comes from the canonical site URL when one is set. */
function callbackUrl(request: NextRequest): string {
  return new URL("/api/auth/google/callback", env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).toString();
}

/** The Google client, or `null` where sign-in isn't configured (local dev and previews without the keys). */
export function googleClient(request: NextRequest): Google | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, callbackUrl(request));
}

/** Options for the short-lived cookies of one sign-in attempt. */
export const attemptCookie = {
  httpOnly: true,
  secure: env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview",
  sameSite: "lax",
  path: "/api/auth/google",
  maxAge: ATTEMPT_MAX_AGE,
} as const;
