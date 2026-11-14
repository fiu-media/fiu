import { decodeIdToken } from "arctic";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { type GoogleClaims, isAllowedAccount, safeNext } from "@/lib/gate/google";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/gate/session";

import { attemptCookie, googleClient, NEXT_COOKIE, STATE_COOKIE, VERIFIER_COOKIE } from "../client";

const plain = (message: string, status: number) =>
  new NextResponse(message, { status, headers: { "Cache-Control": "no-store" } });

/** Finishes staff sign-in: checks the Google account is in our domain, then sets the session cookie. */
export async function GET(request: NextRequest) {
  const google = googleClient(request);
  if (!google || !env.AUTH_SECRET) return plain("Sign-in isn't configured.", 503);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = request.cookies.get(STATE_COOKIE)?.value;
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  if (!code || !state || !savedState || !verifier || state !== savedState) {
    return plain("This sign-in link has expired. Start again from /login.", 400);
  }

  let claims: GoogleClaims;
  try {
    // The token comes straight from Google's token endpoint over TLS, so its signature needn't be checked again.
    claims = decodeIdToken((await google.validateAuthorizationCode(code, verifier)).idToken());
  } catch {
    return plain("Google didn't accept the sign-in. Start again from /login.", 400);
  }

  const clearAttempt = (response: NextResponse) => {
    for (const name of [STATE_COOKIE, VERIFIER_COOKIE, NEXT_COOKIE]) response.cookies.delete({ name, path: attemptCookie.path });
    return response;
  };

  if (!isAllowedAccount(claims, env.AUTH_ALLOWED_DOMAIN)) {
    return clearAttempt(plain("This account isn't part of the Fiú Media workspace.", 403));
  }
  const response = NextResponse.redirect(
    new URL(safeNext(request.cookies.get(NEXT_COOKIE)?.value ?? null), request.nextUrl.origin),
  );
  response.cookies.set(SESSION_COOKIE, await signSession(claims.email, env.AUTH_SECRET), {
    httpOnly: true,
    secure: attemptCookie.secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return clearAttempt(response);
}
