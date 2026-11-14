import { type NextRequest, NextResponse } from "next/server";

import { auth, authConfigured } from "@/lib/auth";

/** Signs staff out. A POST, so a stray link or image can't do it. */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
  if (!authConfigured) return response;
  const cleared = await auth.api.signOut({ headers: request.headers, asResponse: true });
  for (const cookie of cleared.headers.getSetCookie()) response.headers.append("Set-Cookie", cookie);
  return response;
}
