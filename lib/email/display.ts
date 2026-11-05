import { domainToUnicode } from "node:url";

/**
 * An address as visitors should read it: an internationalised domain written as punycode
 * (`hello@xn--fi-ska.ie`) is shown in Unicode (`hello@fiú.ie`). Use it for the text and the
 * `mailto:` link alike. Anything that doesn't convert comes back unchanged.
 */
export function emailForDisplay(address: string): string {
  const at = address.lastIndexOf("@");
  if (at < 1) return address;
  const domain = domainToUnicode(address.slice(at + 1));
  return domain === "" ? address : `${address.slice(0, at)}@${domain}`;
}
