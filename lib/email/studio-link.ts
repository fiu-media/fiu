import "server-only";

/**
 * Deep link to a document in the Studio. Intent URLs resolve whatever the structure looks like.
 * Needs NEXT_PUBLIC_SITE_URL (or Vercel's production URL) so emailed links aren't relative.
 */
export function studioEditUrl(id: string, type: string) {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return `${origin.replace(/\/$/, "")}/studio/intent/edit/id=${encodeURIComponent(id)};type=${type}/`;
}
