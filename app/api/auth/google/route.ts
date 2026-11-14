import { generateCodeVerifier, generateState } from "arctic";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { normaliseDomain, safeNext } from "@/lib/gate/google";

import { attemptCookie, googleClient, NEXT_COOKIE, STATE_COOKIE, VERIFIER_COOKIE } from "./client";

/** Starts staff sign-in: sends the visitor to Google, remembering where they were headed. */
export function GET(request: NextRequest) {
  const google = googleClient(request);
  if (!google) return new NextResponse("Sign-in isn't configured.", { status: 503 });

  const state = generateState();
  const verifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, verifier, ["openid", "email"]);
  // Only a hint for Google's account picker; the callback is what enforces the domain.
  url.searchParams.set("hd", normaliseDomain(env.AUTH_ALLOWED_DOMAIN));

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, attemptCookie);
  response.cookies.set(VERIFIER_COOKIE, verifier, attemptCookie);
  response.cookies.set(NEXT_COOKIE, safeNext(request.nextUrl.searchParams.get("next")), attemptCookie);
  return response;
}
