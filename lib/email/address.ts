// Pure and dependency-free: the form schemas run this in the browser, the mailer on the server.

const ASCII = /^[\x20-\x7e]*$/;
// An ASCII hostname label: letters, digits and inner hyphens (punycode labels included).
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
// What can't appear in the local part of an address (RFC 5322 specials, whitespace and control characters).
const FORBIDDEN_LOCAL = /[\s\u0000-\u001f\u007f@"(),:;<>[\\\]]/;

const utf8Bytes = (value: string) => new TextEncoder().encode(value).length;

/** The ASCII (punycode) form of a hostname, `exämple.de` → `xn--exmple-cua.de`, or `null` if it isn't one. */
export function domainToAscii(domain: string): string | null {
  try {
    const host = new URL(`http://${domain}`).hostname;
    return host === "" ? null : host;
  } catch {
    return null;
  }
}

function split(address: string) {
  const at = address.lastIndexOf("@");
  return at < 1 ? null : { local: address.slice(0, at), domain: address.slice(at + 1) };
}

/**
 * Whether `address` is plausibly deliverable: a local part without specials (accents and other
 * non-ASCII letters are fine, RFC 6531) at a domain with a dot, which may be written in Unicode (IDN).
 */
export function isEmailAddress(address: string): boolean {
  const parts = split(address);
  if (!parts) return false;
  const { local, domain } = parts;
  // `new URL` quietly drops tabs and newlines from a host, so refuse them before it gets the chance.
  if (/\s/.test(domain)) return false;
  if (utf8Bytes(local) > 64 || FORBIDDEN_LOCAL.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;

  const host = domainToAscii(domain);
  if (!host || host.length > 253) return false;
  const labels = host.split(".");
  return labels.length >= 2 && labels.every((label) => LABEL.test(label)) && !/^\d+$/.test(labels.at(-1) ?? "");
}

/**
 * The form of `address` that can be handed to a mail API that speaks plain ASCII SMTP: an
 * internationalised domain becomes punycode. An accented local part (`séan@…`) can only travel
 * with SMTPUTF8, which Resend does not accept, so there is no such form and this returns `null`.
 */
export function toDeliverable(address: string): string | null {
  const parts = split(address);
  if (!parts || !ASCII.test(parts.local)) return null;
  const host = domainToAscii(parts.domain);
  return host ? `${parts.local}@${host}` : null;
}
