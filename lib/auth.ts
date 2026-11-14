import { betterAuth } from "better-auth";
import { google } from "better-auth/social-providers";

import { env } from "@/env";
import { isAllowedAccount, normaliseDomain } from "@/lib/gate/google";

/** How long a sign-in lasts, in seconds. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Google needs the exact callback URL registered, so it comes from the canonical site URL, else the production host, else local dev. */
const baseURL =
  env.NEXT_PUBLIC_SITE_URL
  ?? (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

/** Whether sign-in is set up. Local dev and previews run without the keys, and the gate is then simply closed. */
export const authConfigured = Boolean(env.AUTH_SECRET && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

const credentials = { clientId: env.GOOGLE_CLIENT_ID ?? "", clientSecret: env.GOOGLE_CLIENT_SECRET ?? "" };

/**
 * Google's own profile handling, with any Workspace domain let through (`hd: "*"`). The `hd` option compares the
 * domain character for character, and `fiú.ie` and `xn--fi-ska.ie` are the same domain, so the check that decides
 * who is one of us is `isAllowedAccount`, run below on the profile this returns.
 */
const googleProfile = google({ ...credentials, hd: "*" });

/**
 * Staff sign-in for the pre-launch gate and `/dev`. There is no database: the session is an encrypted cookie, so
 * nothing is stored and signing out only clears it.
 */
export const auth = betterAuth({
  baseURL,
  secret: env.AUTH_SECRET,
  session: { expiresIn: SESSION_MAX_AGE },
  advanced: { cookiePrefix: "fiu" },
  socialProviders: {
    google: {
      ...credentials,
      enabled: authConfigured,
      // Only a hint for Google's account picker; `getUserInfo` is what enforces the domain.
      hd: normaliseDomain(env.AUTH_ALLOWED_DOMAIN),
      async getUserInfo(token) {
        const profile = await googleProfile.getUserInfo(token);
        return profile && isAllowedAccount(profile.data, env.AUTH_ALLOWED_DOMAIN) ? profile : null;
      },
    },
  },
});

/** Whether the request carries a signed-in staff session. Never throws: anything unreadable is "not signed in". */
export async function hasStaffSession(headers: Headers): Promise<boolean> {
  if (!authConfigured) return false;
  try {
    return (await auth.api.getSession({ headers })) !== null;
  } catch {
    return false;
  }
}
