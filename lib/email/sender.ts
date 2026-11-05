// Pure, so scripts/ can use it too.
import { domainToAscii } from "./address";

/**
 * The From header for mail sent on `domain`, the domain verified in Resend (RESEND_EMAIL_DOMAIN).
 * An internationalised domain (`fiú.ie`) is written as punycode: Resend speaks ASCII SMTP.
 */
export const senderFor = (domain: string) => `Fiú Media <hello@${domainToAscii(domain) ?? domain}>`;
