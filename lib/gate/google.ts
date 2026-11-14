import { domainToASCII } from "node:url";

/** The parts of Google's ID token claims that decide whether someone is one of us. */
export type GoogleClaims = {
  email?: unknown;
  email_verified?: unknown;
  /** The Workspace domain the account belongs to. Absent for personal Gmail accounts. */
  hd?: unknown;
};

/** `fiú.ie` and `xn--fi-ska.ie` are the same domain; compare them in their ASCII form, lower-cased. */
export const normaliseDomain = (domain: string): string => domainToASCII(domain.trim().toLowerCase());

/**
 * Whether a Google account belongs to `domain`'s Workspace. All three must hold: Google says the address is verified,
 * the account's Workspace domain is `domain`, and the address itself ends in `@domain`. Checking the address by
 * suffix alone would let `a@xn--fi-ska.ie.evil.com`, or a personal account on a look-alike, through.
 */
export function isAllowedAccount(claims: GoogleClaims, domain: string): claims is GoogleClaims & { email: string } {
  const allowed = normaliseDomain(domain);
  if (!allowed) return false;
  const { email, email_verified: verified, hd } = claims;
  if (typeof email !== "string" || verified !== true || typeof hd !== "string") return false;
  const [local, host, ...rest] = email.split("@");
  return Boolean(local) && rest.length === 0 && normaliseDomain(host ?? "") === allowed && normaliseDomain(hd) === allowed;
}

/** A `next` redirect target that stays on this site: a path, not `//host` or `/\host`, which browsers treat as another site. */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
