import { jwtVerify, SignJWT } from "jose";

/** The cookie that holds a signed-in staff member's session. */
export const SESSION_COOKIE = "fiu-session";
/** How long a sign-in lasts, in seconds. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const key = (secret: string) => new TextEncoder().encode(secret);

/** A signed token for `email`, valid for `SESSION_MAX_AGE` from `now`. */
export function signSession(email: string, secret: string, now: Date = new Date()): Promise<string> {
  const issued = Math.floor(now.getTime() / 1000);
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issued)
    .setExpirationTime(issued + SESSION_MAX_AGE)
    .sign(key(secret));
}

/** Whether `token` was signed with `secret` and hasn't expired. Never throws: anything unreadable is "not signed in". */
export async function hasValidSession(
  token: string | undefined,
  secret: string | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"], currentDate: now });
    return typeof payload.email === "string";
  } catch {
    return false;
  }
}
