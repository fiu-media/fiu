// Pure, so scripts/ can use it too.

/** The From header for mail sent on `domain`, the domain verified in Resend (RESEND_EMAIL_DOMAIN). */
export const senderFor = (domain: string) => `Fiú Media <hello@${domain}>`;
