/**
 * Asks Resend whether it accepts internationalised email addresses, so the answer in
 * lib/email/address.ts (`toDeliverable`) can be checked against the real API rather than reports.
 *
 *   npm run check:email-eai                       # Resend's own test inbox, with and without an accent
 *   npm run check:email-eai -- you@exämple.de     # also your own IDN address, as Unicode and as punycode
 *
 * Each case is a real API call that sends one small test email. The `delivered@resend.dev` cases
 * go to Resend's simulator and never reach anyone's inbox. Needs RESEND_API_KEY (and optionally
 * EMAIL_FROM) in .env.local.
 */
import { Resend } from "resend";
import { domainToAscii } from "../lib/email/address";

const key = process.env.RESEND_API_KEY;
if (!key) throw new Error("RESEND_API_KEY is not set (add it to .env.local)");
const resend = new Resend(key);
const from = process.env.EMAIL_FROM || "Fiú Media <onboarding@resend.dev>";

const cases: [string, string][] = [
  ["ASCII (control)", "delivered@resend.dev"],
  ["accent in the local part", "delivered+séan@resend.dev"],
];
const own = process.argv[2];
if (own) {
  const at = own.lastIndexOf("@");
  cases.push(
    ["your address, as typed", own],
    ["your address, domain as punycode", `${own.slice(0, at)}@${domainToAscii(own.slice(at + 1))}`],
  );
}

for (const [label, to] of cases) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Fiú: internationalised address check",
    text: "Sent by scripts/check-resend-eai.ts.",
  });
  console.log(
    `${label.padEnd(34)} ${to.padEnd(34)} ${error ? `REJECTED  ${error.name}: ${error.message}` : `accepted  ${data?.id}`}`,
  );
}
