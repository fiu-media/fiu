import { track } from "@vercel/analytics";

import type { EnquiryType } from "./forms/enquiry-types";

/**
 * Custom events for Vercel Web Analytics. Names are Title Case (Vercel's convention). Properties stay
 * enums, counts and slugs only — never names, emails or other personal data.
 */
type Events = {
  "Contact Submitted": { enquiryType: EnquiryType };
  "Quote Submitted": { itemCount: number };
  "Film Played": { slug: string };
  "Outbound Link": { destination: "instagram" | "email" };
};

export function trackEvent<E extends keyof Events>(name: E, properties: Events[E]) {
  track(name, properties);
}
