import "server-only";

import { env } from "@/env";
import { studioUrl } from "@/sanity/studio-env";

/**
 * The site's public origin, for links and images in emails, which can't be relative. Never localhost, even in
 * development: a link or logo that points at the developer's machine is useless once an email leaves it. The
 * last resort is the live site, in punycode (fiú.ie) because mail clients and Resend speak ASCII.
 */
export function siteOrigin() {
  const fallback = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://xn--fi-ska.ie";
  // `env` turns an empty NEXT_PUBLIC_SITE_URL into undefined, so it falls back too.
  const origin = env.NEXT_PUBLIC_SITE_URL ?? fallback;
  return origin.replace(/\/$/, "");
}

/** Deep link to a document in the hosted Studio. Intent URLs resolve whatever the structure looks like. */
export function studioEditUrl(id: string, type: string) {
  return `${studioUrl}/intent/edit/id=${encodeURIComponent(id)};type=${type}/`;
}
