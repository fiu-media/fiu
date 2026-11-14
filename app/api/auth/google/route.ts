import { type NextRequest, NextResponse } from "next/server";

import { auth, authConfigured } from "@/lib/auth";
import { safeNext } from "@/lib/gate/google";

/** Starts staff sign-in: sends the visitor to Google, remembering where they were headed. */
export async function GET(request: NextRequest) {
  if (!authConfigured) return new NextResponse("Sign-in isn't configured.", { status: 503 });

  // Better Auth starts a sign-in with a POST. This takes that answer and turns it into the redirect a link needs, so
  // the proxy can send a visitor here with a plain redirect.
  const started = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: safeNext(request.nextUrl.searchParams.get("next")) },
    headers: request.headers,
    asResponse: true,
  });
  const url = started.headers.get("location");
  if (!url) return new NextResponse("Sign-in isn't available right now.", { status: 502 });

  const response = NextResponse.redirect(url);
  for (const cookie of started.headers.getSetCookie()) response.headers.append("Set-Cookie", cookie);
  return response;
}
